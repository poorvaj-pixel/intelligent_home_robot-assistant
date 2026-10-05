// Collision-aware navigation for the home robot.
// - The robot is modelled as a disc (ROBOT_RADIUS + SAFETY) on the floor.
// - Walls, closed doors, open door leaves and furniture are inflated by that disc,
//   so any free cell means "the whole robot body fits here without touching".
// - A* runs on a fine occupancy grid; shortcuts are only taken when the whole
//   swept segment stays free.
import { FURNITURE, FURNITURE_DIMS, WALLS, WALL_THICKNESS, type FurnitureKind } from "@/environment/layout";
import { DOORS, DOORWAY_TO_DOOR, isDoorOpen, openLeafRect } from "@/environment/doorManager";

export interface P2 {
  x: number;
  z: number;
}

export const ROBOT_RADIUS = 0.3;
const SAFETY = 0.05;
export const CLEARANCE = ROBOT_RADIUS + SAFETY;

const CELL = 0.1;
const MIN_X = -6.6;
const MAX_X = 6.6;
const MIN_Z = -5.6;
const MAX_Z = 7.6;
const COLS = Math.round((MAX_X - MIN_X) / CELL) + 1;
const ROWS = Math.round((MAX_Z - MIN_Z) / CELL) + 1;

// ---------- dynamic furniture poses (chairs can be moved by tasks) ----------
interface Pose {
  x: number;
  z: number;
  rot: number;
}
const furniturePoses = new Map<string, Pose>();
export function setFurniturePose(id: string, pose: Pose) {
  furniturePoses.set(id, pose);
}
export function resetFurniturePoses() {
  furniturePoses.clear();
}
function poseOf(id: string, fallback: Pose) {
  return furniturePoses.get(id) ?? fallback;
}

// ---------- geometry helpers ----------
function distToSegment(px: number, pz: number, ax: number, az: number, bx: number, bz: number) {
  const dx = bx - ax;
  const dz = bz - az;
  const len2 = dx * dx + dz * dz;
  if (len2 === 0) return Math.hypot(px - ax, pz - az);
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / len2));
  return Math.hypot(px - (ax + t * dx), pz - (az + t * dz));
}

interface Seg {
  ax: number;
  az: number;
  bx: number;
  bz: number;
}

/** Solid wall pieces; when includeClosedDoors, closed doorways become solid too. */
function wallSegments(doorsAsOpen: boolean): Seg[] {
  const out: Seg[] = [];
  for (const w of WALLS) {
    const horizontal = w.from[1] === w.to[1];
    const fixed = horizontal ? w.from[1] : w.from[0];
    const start = horizontal ? Math.min(w.from[0], w.to[0]) : Math.min(w.from[1], w.to[1]);
    const end = horizontal ? Math.max(w.from[0], w.to[0]) : Math.max(w.from[1], w.to[1]);
    const gaps = (w.doors ?? [])
      .filter((d) => {
        const doorId = DOORWAY_TO_DOOR[d.id];
        if (!doorId) return true; // plain opening, always passable
        return doorsAsOpen || isDoorOpen(doorId);
      })
      .map((d) => [d.at - d.width / 2, d.at + d.width / 2] as const)
      .sort((a, b) => a[0] - b[0]);
    let cur = start;
    const push = (a: number, b: number) => {
      if (b - a < 0.001) return;
      out.push(horizontal ? { ax: a, az: fixed, bx: b, bz: fixed } : { ax: fixed, az: a, bx: fixed, bz: b });
    };
    for (const [g0, g1] of gaps) {
      push(cur, g0);
      cur = g1;
    }
    push(cur, end);
  }
  return out;
}

interface Box {
  cx: number;
  cz: number;
  hw: number;
  hd: number;
  cos: number;
  sin: number;
}

function furnitureBoxes(): Box[] {
  const out: Box[] = [];
  for (const f of FURNITURE) {
    if (!f.obstacle) continue;
    const [w, , d] = FURNITURE_DIMS[f.kind as FurnitureKind];
    const p = poseOf(f.id, { x: f.position[0], z: f.position[2], rot: f.rotationY ?? 0 });
    out.push({ cx: p.x, cz: p.z, hw: w / 2, hd: d / 2, cos: Math.cos(p.rot), sin: Math.sin(p.rot) });
  }
  return out;
}

function leafBoxes(doorsAsOpen: boolean): Box[] {
  const out: Box[] = [];
  for (const d of DOORS) {
    if (!isDoorOpen(d.id) && !doorsAsOpen) continue;
    const r = openLeafRect(d);
    out.push({ cx: (r.minX + r.maxX) / 2, cz: (r.minZ + r.maxZ) / 2, hw: (r.maxX - r.minX) / 2, hd: (r.maxZ - r.minZ) / 2, cos: 1, sin: 0 });
  }
  return out;
}

function distToBox(px: number, pz: number, b: Box) {
  const dx = px - b.cx;
  const dz = pz - b.cz;
  // world → local (inverse of rotation about Y)
  const lx = dx * b.cos - dz * b.sin;
  const lz = dx * b.sin + dz * b.cos;
  const ox = Math.max(Math.abs(lx) - b.hw, 0);
  const oz = Math.max(Math.abs(lz) - b.hd, 0);
  return Math.hypot(ox, oz);
}

// ---------- obstacle map ----------
export interface ObstacleMap {
  blocked: (x: number, z: number) => boolean;
  segmentBlocked: (ax: number, az: number, bx: number, bz: number) => boolean;
}

export function buildObstacleMap(opts: { doorsAsOpen?: boolean; clearance?: number } = {}): ObstacleMap {
  const doorsAsOpen = !!opts.doorsAsOpen;
  const clear = opts.clearance ?? CLEARANCE;
  const walls = wallSegments(doorsAsOpen);
  const boxes = [...furnitureBoxes(), ...leafBoxes(doorsAsOpen)];
  const wallClear = clear + WALL_THICKNESS / 2;
  const blocked = (x: number, z: number) => {
    if (x < MIN_X + 0.2 || x > MAX_X - 0.2 || z < MIN_Z + 0.2 || z > MAX_Z - 0.2) return true;
    for (const s of walls) if (distToSegment(x, z, s.ax, s.az, s.bx, s.bz) < wallClear) return true;
    for (const b of boxes) if (distToBox(x, z, b) < clear) return true;
    return false;
  };
  const segmentBlocked = (ax: number, az: number, bx: number, bz: number) => {
    const dist = Math.hypot(bx - ax, bz - az);
    const n = Math.max(1, Math.ceil(dist / 0.04));
    for (let i = 1; i <= n; i++) {
      const t = i / n;
      if (blocked(ax + (bx - ax) * t, az + (bz - az) * t)) return true;
    }
    return false;
  };
  return { blocked, segmentBlocked };
}

/** Live check used every frame while the robot moves. */
export function isBlocked(x: number, z: number) {
  return buildObstacleMap().blocked(x, z);
}

// ---------- A* ----------
const idx = (c: number, r: number) => r * COLS + c;
const toCol = (x: number) => Math.round((x - MIN_X) / CELL);
const toRow = (z: number) => Math.round((z - MIN_Z) / CELL);
const colX = (c: number) => MIN_X + c * CELL;
const rowZ = (r: number) => MIN_Z + r * CELL;

class Heap {
  private items: number[] = [];
  private pri: number[] = [];
  get size() {
    return this.items.length;
  }
  push(item: number, p: number) {
    this.items.push(item);
    this.pri.push(p);
    let i = this.items.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this.pri[parent]! <= this.pri[i]!) break;
      this.swap(i, parent);
      i = parent;
    }
  }
  pop() {
    const top = this.items[0]!;
    const lastI = this.items.pop()!;
    const lastP = this.pri.pop()!;
    if (this.items.length) {
      this.items[0] = lastI;
      this.pri[0] = lastP;
      let i = 0;
      for (;;) {
        const l = i * 2 + 1;
        const r = l + 1;
        let m = i;
        if (l < this.items.length && this.pri[l]! < this.pri[m]!) m = l;
        if (r < this.items.length && this.pri[r]! < this.pri[m]!) m = r;
        if (m === i) break;
        this.swap(i, m);
        i = m;
      }
    }
    return top;
  }
  private swap(a: number, b: number) {
    [this.items[a], this.items[b]] = [this.items[b]!, this.items[a]!];
    [this.pri[a], this.pri[b]] = [this.pri[b]!, this.pri[a]!];
  }
}

function nearestFreeCell(map: ObstacleMap, x: number, z: number): P2 | null {
  if (!map.blocked(x, z)) return { x, z };
  for (let r = CELL; r <= 1.2; r += CELL) {
    let best: P2 | null = null;
    let bestD = Infinity;
    const steps = Math.max(12, Math.round((2 * Math.PI * r) / (CELL * 0.7)));
    for (let i = 0; i < steps; i++) {
      const a = (i / steps) * Math.PI * 2;
      const px = x + Math.cos(a) * r;
      const pz = z + Math.sin(a) * r;
      if (!map.blocked(px, pz)) {
        const d = Math.hypot(px - x, pz - z);
        if (d < bestD) {
          bestD = d;
          best = { x: px, z: pz };
        }
      }
    }
    if (best) return best;
  }
  return null;
}

/**
 * Plan a collision-free path. Returns null if no route exists.
 * If the robot currently overlaps an inflated obstacle (e.g. a door just swung
 * open beside it) the path starts with a short escape move to the nearest free spot.
 */
export function findPath(from: P2, to: P2, opts: { doorsAsOpen?: boolean } = {}): P2[] | null {
  const map = buildObstacleMap(opts);
  const start = nearestFreeCell(map, from.x, from.z);
  const goal = nearestFreeCell(map, to.x, to.z);
  if (!start || !goal) return null;

  const sc = toCol(start.x);
  const sr = toRow(start.z);
  const gc = toCol(goal.x);
  const gr = toRow(goal.z);
  const blockedCache = new Int8Array(COLS * ROWS).fill(-1);
  const cellBlocked = (c: number, r: number) => {
    if (c < 0 || r < 0 || c >= COLS || r >= ROWS) return true;
    const i = idx(c, r);
    if (blockedCache[i] === -1) blockedCache[i] = map.blocked(colX(c), rowZ(r)) ? 1 : 0;
    return blockedCache[i] === 1;
  };
  // Start/goal snap cells may be marginally blocked due to rounding — allow them.
  const isFree = (c: number, r: number) => (c === sc && r === sr) || (c === gc && r === gr) || !cellBlocked(c, r);

  const g = new Float32Array(COLS * ROWS).fill(Infinity);
  const came = new Int32Array(COLS * ROWS).fill(-1);
  const closed = new Uint8Array(COLS * ROWS);
  const heap = new Heap();
  const h = (c: number, r: number) => Math.hypot(c - gc, r - gr);
  g[idx(sc, sr)] = 0;
  heap.push(idx(sc, sr), h(sc, sr));
  const dirs = [
    [1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1],
    [1, 1, Math.SQRT2], [1, -1, Math.SQRT2], [-1, 1, Math.SQRT2], [-1, -1, Math.SQRT2],
  ] as const;
  let found = false;
  while (heap.size) {
    const cur = heap.pop();
    if (closed[cur]) continue;
    closed[cur] = 1;
    const c = cur % COLS;
    const r = (cur - c) / COLS;
    if (c === gc && r === gr) {
      found = true;
      break;
    }
    for (const [dc, dr, cost] of dirs) {
      const nc = c + dc;
      const nr = r + dr;
      if (!isFree(nc, nr)) continue;
      if (dc !== 0 && dr !== 0 && (!isFree(c + dc, r) || !isFree(c, r + dr))) continue; // no corner cutting
      const ni = idx(nc, nr);
      if (closed[ni]) continue;
      const t = g[cur]! + cost;
      if (t < g[ni]!) {
        g[ni] = t;
        came[ni] = cur;
        heap.push(ni, t + h(nc, nr));
      }
    }
  }
  if (!found) return null;

  const cells: P2[] = [];
  for (let i = idx(gc, gr); i !== -1; i = came[i]!) {
    const c = i % COLS;
    cells.push({ x: colX(c), z: rowZ((i - c) / COLS) });
  }
  cells.reverse();
  cells[0] = { ...start };
  cells[cells.length - 1] = { ...goal };

  // String-pulling: keep a shortcut only when the whole swept segment is free.
  const out: P2[] = [cells[0]!];
  let anchor = 0;
  for (let i = 2; i < cells.length; i++) {
    const a = cells[anchor]!;
    const b = cells[i]!;
    if (map.segmentBlocked(a.x, a.z, b.x, b.z)) {
      out.push(cells[i - 1]!);
      anchor = i - 1;
    }
  }
  out.push(cells[cells.length - 1]!);

  const path: P2[] = [];
  if (Math.hypot(start.x - from.x, start.z - from.z) > 0.01) path.push({ ...from });
  for (const p of out) {
    const last = path[path.length - 1];
    if (!last || Math.hypot(last.x - p.x, last.z - p.z) > 0.02) path.push(p);
  }
  return path;
}

/** Closed doors that a path (planned with doorsAsOpen) passes through, in order. */
export function closedDoorsOnPath(path: P2[]) {
  const hits: string[] = [];
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1]!;
    const b = path[i]!;
    const n = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.z - a.z) / 0.05));
    for (let k = 0; k <= n; k++) {
      const x = a.x + ((b.x - a.x) * k) / n;
      const z = a.z + ((b.z - a.z) * k) / n;
      for (const d of DOORS) {
        if (isDoorOpen(d.id) || hits.includes(d.id)) continue;
        if (Math.abs(z - d.wallZ) < 0.06 && Math.abs(x - d.at) < d.width / 2) hits.push(d.id);
      }
    }
  }
  return hits as (typeof DOORS)[number]["id"][];
}

/** Does the straight line between two points pass through a wall (ignoring doorways)? */
function crossesWall(ax: number, az: number, bx: number, bz: number) {
  const segs = wallSegments(true);
  const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / 0.03));
  for (let i = 0; i <= n; i++) {
    const x = ax + ((bx - ax) * i) / n;
    const z = az + ((bz - az) * i) / n;
    for (const s of segs) if (distToSegment(x, z, s.ax, s.az, s.bx, s.bz) < WALL_THICKNESS / 2 + 0.01) return true;
  }
  return false;
}

/**
 * Closest floor point where the whole robot fits, in the same room as `target`
 * (no wall in between) and actually reachable from `from`. Used as the
 * "stand here to reach it" point.
 */
export function approachPoint(target: P2, preferred?: P2, from?: P2): P2 | null {
  const map = buildObstacleMap({ doorsAsOpen: true });
  const ok = (p: P2) => !map.blocked(p.x, p.z) && !crossesWall(p.x, p.z, target.x, target.z);
  const candidates: { p: P2; score: number }[] = [];
  if (preferred && ok(preferred)) candidates.push({ p: preferred, score: -1 });
  for (let r = 0.3; r <= 1.6; r += 0.05) {
    const steps = 48;
    for (let i = 0; i < steps; i++) {
      const a = (i / steps) * Math.PI * 2;
      const p = { x: target.x + Math.cos(a) * r, z: target.z + Math.sin(a) * r };
      if (!ok(p)) continue;
      candidates.push({ p, score: r * 10 + (preferred ? Math.hypot(p.x - preferred.x, p.z - preferred.z) : 0) });
    }
  }
  candidates.sort((x, y) => x.score - y.score);
  if (!from) return candidates[0]?.p ?? null;
  const tried: P2[] = [];
  for (const c of candidates) {
    if (tried.length >= 25) break;
    if (tried.some((t) => Math.hypot(t.x - c.p.x, t.z - c.p.z) < 0.25)) continue; // skip near-duplicates
    tried.push(c.p);
    if (findPath(from, c.p, { doorsAsOpen: true })) return c.p;
  }
  return null;
}

export function pathLength(path: P2[]) {
  let l = 0;
  for (let i = 1; i < path.length; i++) l += Math.hypot(path[i]!.x - path[i - 1]!.x, path[i]!.z - path[i - 1]!.z);
  return l;
}
