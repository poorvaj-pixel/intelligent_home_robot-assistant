// Runs household tasks inside the 3D scene. Each task is a generator script
// that yields once per frame; STOP simply drops the running script.
import { useFrame, useThree } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import { useRef } from "react";
import * as THREE from "three";
import { CHAIR_TARGETS, FURNITURE, HOUSEHOLD_OBJECTS, ROBOT_START } from "@/environment/layout";
import { DOOR_BY_ID, isDoorOpen, resetDoors, setDoorOpen, type DoorId } from "@/environment/doorManager";
import {
  CLEARANCE,
  approachPoint,
  buildObstacleMap,
  closedDoorsOnPath,
  findPath,
  resetFurniturePoses,
  setFurniturePose,
  type P2,
} from "./navigation";
import { sendCommand, type Command } from "./robotState";
import {
  getTaskSnapshot,
  say,
  setDisplayPath,
  setFridgeOpen,
  setTask,
  takeControls,
  useDisplayPath,
  type TaskRequest,
} from "./taskStore";

type Script = Generator<void, void, void>;

const DRIVE_SPEED = 1.3; // m/s
const TURN_SPEED = 3.2; // rad/s
const CHAIR_CLEARANCE = CLEARANCE + 0.15;

interface Ctx {
  robot: THREE.Group;
  scene: THREE.Scene;
  dt: number;
  carried: { obj: THREE.Object3D; kind: "item" | "chair"; id: string } | null;
}

/** Optional ?speed=N in the URL fast-forwards the simulation (handy for demos/tests). */
const timeScale = typeof window !== "undefined" ? Math.min(20, Math.max(0.25, Number(new URLSearchParams(window.location.search).get("speed")) || 1)) : 1;

class TaskFailed extends Error {}

const angleDiff = (a: number, b: number) => {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
};

function obj(ctx: Ctx, id: string) {
  const o = ctx.scene.getObjectByName(id);
  if (!o) throw new TaskFailed(`Could not find ${id} in the house.`);
  return o;
}

function handPoint(ctx: Ctx, kind: "item" | "chair") {
  return kind === "chair" ? ctx.robot.localToWorld(new THREE.Vector3(0, 0.12, 0.62)) : ctx.robot.localToWorld(new THREE.Vector3(0, 0.78, 0.42));
}

// ---------------- primitive actions ----------------
function* wait(ctx: Ctx, seconds: number): Script {
  let t = 0;
  while (t < seconds) {
    yield;
    t += ctx.dt;
  }
}

function* arm(ctx: Ctx, cmd: Command, seconds = 0.6): Script {
  sendCommand(cmd);
  yield* wait(ctx, seconds);
}

function* turnTo(ctx: Ctx, heading: number): Script {
  for (;;) {
    const d = angleDiff(ctx.robot.rotation.y, heading);
    if (Math.abs(d) < 0.02) {
      ctx.robot.rotation.y = heading;
      return;
    }
    ctx.robot.rotation.y += Math.sign(d) * Math.min(Math.abs(d), TURN_SPEED * ctx.dt);
    yield;
  }
}

function* face(ctx: Ctx, target: P2): Script {
  const dx = target.x - ctx.robot.position.x;
  const dz = target.z - ctx.robot.position.z;
  if (Math.hypot(dx, dz) < 0.01) return;
  yield* turnTo(ctx, Math.atan2(dx, dz));
}

function clearanceFor(ctx: Ctx) {
  return ctx.carried?.kind === "chair" ? CHAIR_CLEARANCE : CLEARANCE;
}

/** Drive to a floor point, opening closed doors on the way and never touching obstacles. */
function* goTo(ctx: Ctx, target: P2, label: string): Script {
  for (let attempt = 0; attempt < 8; attempt++) {
    const here = { x: ctx.robot.position.x, z: ctx.robot.position.z };
    let path = findPath(here, target);
    if (!path) {
      const viaDoors = findPath(here, target, { doorsAsOpen: true });
      const doors = viaDoors ? closedDoorsOnPath(viaDoors) : [];
      if (!viaDoors || doors.length === 0) throw new TaskFailed(`No safe route to ${label} — the way is blocked.`);
      say(`The ${DOOR_BY_ID[doors[0]!].label.toLowerCase()} is closed — going to open it.`);
      yield* operateDoor(ctx, doors[0]!, true);
      continue;
    }
    if (ctx.carried?.kind === "chair") {
      // Carrying a chair makes the robot wider: replan with extra clearance if possible.
      const wide = findPathWithClearance(here, target, CHAIR_CLEARANCE);
      if (wide) path = wide;
    }
    setDisplayPath(path);
    const ok = yield* follow(ctx, path);
    if (ok) {
      setDisplayPath([]);
      return;
    }
    say("Obstacle ahead — replanning a safe route…");
  }
  throw new TaskFailed(`Could not reach ${label}.`);
}

function findPathWithClearance(from: P2, to: P2, clearance: number) {
  const map = buildObstacleMap({ clearance });
  if (map.blocked(to.x, to.z)) return null;
  const p = findPath(from, to);
  if (!p) return null;
  for (let i = 1; i < p.length; i++) if (map.segmentBlocked(p[i - 1]!.x, p[i - 1]!.z, p[i]!.x, p[i]!.z)) return null;
  return p;
}

/** Follow waypoints; returns false if the next step would collide (caller replans). */
function* follow(ctx: Ctx, path: P2[]): Generator<void, boolean, void> {
  const map = buildObstacleMap();
  const r = ctx.robot;
  for (let i = 1; i < path.length; i++) {
    const wp = path[i]!;
    yield* face(ctx, wp);
    for (;;) {
      const dx = wp.x - r.position.x;
      const dz = wp.z - r.position.z;
      const dist = Math.hypot(dx, dz);
      if (dist < 0.01) break;
      const step = Math.min(dist, DRIVE_SPEED * ctx.dt);
      // Sweep the move in small sub-steps so the robot can never skip through an obstacle.
      const subs = Math.max(1, Math.ceil(step / 0.04));
      for (let k = 0; k < subs; k++) {
        const nx = r.position.x + ((dx / dist) * step) / subs;
        const nz = r.position.z + ((dz / dist) * step) / subs;
        // Moving from a free spot into an inflated obstacle is never allowed.
        if (map.blocked(nx, nz) && !map.blocked(r.position.x, r.position.z)) return false;
        r.position.x = nx;
        r.position.z = nz;
      }
      yield;
    }
  }
  return true;
}

function* approach(ctx: Ctx, target: P2, label: string, preferred?: P2): Script {
  const p = approachPoint(target, preferred, { x: ctx.robot.position.x, z: ctx.robot.position.z });
  if (!p) throw new TaskFailed(`Cannot find a safe spot next to ${label}.`);
  yield* goTo(ctx, p, label);
  yield* face(ctx, target);
}

function* animateTo(ctx: Ctx, o: THREE.Object3D, getTarget: () => THREE.Vector3, rotY: number | null, seconds: number): Script {
  const start = o.position.clone();
  const startRot = o.rotation.y;
  let t = 0;
  while (t < seconds) {
    t += ctx.dt;
    const k = Math.min(1, t / seconds);
    const e = k * k * (3 - 2 * k);
    o.position.lerpVectors(start, getTarget(), e);
    if (rotY !== null) o.rotation.y = startRot + angleDiff(startRot, rotY) * e;
    yield;
  }
}

function* pick(ctx: Ctx, id: string, label: string, kind: "item" | "chair" = "item"): Script {
  const o = obj(ctx, id);
  const at = { x: o.position.x, z: o.position.z };
  say(`Going to the ${label}…`);
  yield* approach(ctx, at, label);
  say(`Picking up the ${label}.`);
  yield* arm(ctx, "REACH", 0.6);
  sendCommand("GRASP");
  if (kind === "chair") setFurniturePose(id, { x: 999, z: 999, rot: 0 }); // no longer a floor obstacle
  yield* animateTo(ctx, o, () => handPoint(ctx, kind), null, 0.7);
  ctx.carried = { obj: o, kind, id };
  yield* arm(ctx, "LIFT", 0.4);
}

function* place(ctx: Ctx, pos: THREE.Vector3, rotY: number | null, label: string, preferred?: P2): Script {
  const c = ctx.carried;
  if (!c) return;
  say(`Carrying it to the ${label}…`);
  yield* approach(ctx, { x: pos.x, z: pos.z }, label, preferred);
  say(`Placing it on the ${label}.`);
  yield* arm(ctx, "REACH", 0.5);
  ctx.carried = null;
  yield* animateTo(ctx, c.obj, () => pos, rotY, 0.8);
  if (c.kind === "chair") setFurniturePose(c.id, { x: pos.x, z: pos.z, rot: rotY ?? c.obj.rotation.y });
  yield* arm(ctx, "RELEASE", 0.4);
  sendCommand("REST");
  yield* wait(ctx, 0.2);
}

function* operateDoor(ctx: Ctx, id: DoorId, open: boolean): Script {
  if (isDoorOpen(id) === open) return;
  const d = DOOR_BY_ID[id];
  const here = { x: ctx.robot.position.x, z: ctx.robot.position.z };
  // Try both sides of the door; use whichever the robot can reach without passing through it.
  let path: P2[] | null = null;
  for (const side of [Math.sign(here.z - d.wallZ) || 1, -(Math.sign(here.z - d.wallZ) || 1)]) {
    const onSwingSide = side === d.swingZ;
    const preferred = onSwingSide ? { x: d.at + d.hingeSide * 0.3, z: d.wallZ + side * 1.15 } : { x: d.at, z: d.wallZ + side * 0.45 };
    const p = approachPoint({ x: d.at, z: d.wallZ + side * 0.25 }, preferred);
    if (!p || Math.sign(p.z - d.wallZ) !== side) continue;
    path = findPath(here, p);
    if (path) break;
  }
  if (!path) throw new TaskFailed(`No safe route to the ${d.label.toLowerCase()}.`);
  say(`Going to the ${d.label.toLowerCase()} to ${open ? "open" : "close"} it…`);
  setDisplayPath(path);
  if (!(yield* follow(ctx, path))) throw new TaskFailed(`Blocked on the way to the ${d.label.toLowerCase()}.`);
  setDisplayPath([]);
  yield* face(ctx, { x: d.at, z: d.wallZ });
  yield* arm(ctx, "REACH", 0.6);
  setDoorOpen(id, open);
  say(`${d.label} ${open ? "opened" : "closed"}.`);
  yield* wait(ctx, 0.9);
  sendCommand("REST");
  yield* wait(ctx, 0.2);
}

// ---------------- task scripts ----------------
const shelfSpot = (i: number) => {
  // Bookshelf at (1.77, -2.6), rotated -90° (faces -X). Stack books flat in the empty bay on shelf 2.
  const lx = 0.25;
  const lz = 0.02;
  return new THREE.Vector3(1.77 - lz, 0.5 + i * 0.045, -2.6 + lx);
};

function* organizeBookshelf(ctx: Ctx): Script {
  const books = ["book-misplaced-1", "book-misplaced-2", "book-misplaced-3"];
  setTask({ totalItems: books.length });
  for (let i = 0; i < books.length; i++) {
    setTask({ currentItem: i + 1 });
    yield* pick(ctx, books[i]!, `misplaced book ${i + 1}`);
    yield* place(ctx, shelfSpot(i), -Math.PI / 2, "bookshelf", { x: 1.2, z: -2.45 });
  }
  return void say("Bookshelf organized — all 3 books are back on the shelf.");
}

function* bringCup(ctx: Ctx): Script {
  setTask({ totalItems: 1, currentItem: 1 });
  yield* pick(ctx, "cup-2", "cup in the kitchen");
  yield* place(ctx, new THREE.Vector3(-3.17, 0.5, -4.6), 0, "bedside table in the bedroom");
  say("Cup delivered to the bedroom bedside table.");
}

function* organizeVegetables(ctx: Ctx): Script {
  const veg: [string, string, THREE.Vector3][] = [
    ["vegetable-carrot", "carrot", new THREE.Vector3(5.38, 1.0, -4.55)],
    ["vegetable-tomato", "tomato", new THREE.Vector3(5.7, 1.0, -4.55)],
    ["vegetable-cucumber", "cucumber", new THREE.Vector3(5.55, 0.58, -4.55)],
  ];
  setTask({ totalItems: veg.length });
  const fridgeFront = { x: 5.5, z: -3.75 };
  say("Opening the fridge…");
  yield* approach(ctx, { x: 5.55, z: -4.2 }, "fridge", fridgeFront);
  yield* arm(ctx, "REACH", 0.5);
  setFridgeOpen(true);
  yield* wait(ctx, 0.8);
  sendCommand("REST");
  for (let i = 0; i < veg.length; i++) {
    const [id, label, pos] = veg[i]!;
    setTask({ currentItem: i + 1 });
    yield* pick(ctx, id, label);
    yield* place(ctx, pos, 0, "fridge shelf", fridgeFront);
  }
  yield* arm(ctx, "REACH", 0.4);
  setFridgeOpen(false);
  yield* wait(ctx, 0.7);
  sendCommand("REST");
  say("Vegetables are stored in the fridge and the fridge is closed.");
}

function* arrangeDining(ctx: Ctx): Script {
  const items: [string, string, THREE.Vector3, number][] = [
    ["dining-plate", "plate", new THREE.Vector3(3.4, 0.75, 3.0), 0],
    ["dining-spoon", "spoon", new THREE.Vector3(3.66, 0.75, 3.0), 0],
    ["dining-cup", "cup", new THREE.Vector3(3.62, 0.75, 2.75), 0],
  ];
  setTask({ totalItems: items.length });
  for (let i = 0; i < items.length; i++) {
    const [id, label, pos, rot] = items[i]!;
    setTask({ currentItem: i + 1 });
    yield* pick(ctx, id, label);
    yield* place(ctx, pos, rot, "dining table", { x: 2.75, z: 2.95 });
  }
  say("Dining table set: plate, spoon and cup are in place.");
}

function* arrangeChairs(ctx: Ctx): Script {
  const ids = Object.keys(CHAIR_TARGETS);
  setTask({ totalItems: ids.length });
  for (let i = 0; i < ids.length; i++) {
    const id = ids[i]!;
    const [x, z, rot] = CHAIR_TARGETS[id]!;
    setTask({ currentItem: i + 1 });
    const chair = obj(ctx, id);
    if (Math.hypot(chair.position.x - x, chair.position.z - z) < 0.05 && Math.abs(angleDiff(chair.rotation.y, rot)) < 0.05) continue;
    yield* pick(ctx, id, `chair ${i + 1}`, "chair");
    // Stand on the open side of the seat (away from the table) to tuck it in.
    const outward = z < 3 ? -1 : 1;
    yield* place(ctx, new THREE.Vector3(x, 0, z), rot, `seat ${i + 1} at the table`, { x, z: z + outward * 0.85 });
  }
  say("All four chairs are neatly tucked in around the table.");
}

function* doorTask(ctx: Ctx, id: DoorId, open: boolean): Script {
  setTask({ totalItems: 1, currentItem: 1 });
  if (isDoorOpen(id) === open) return void say(`${DOOR_BY_ID[id].label} is already ${open ? "open" : "closed"}.`);
  yield* operateDoor(ctx, id, open);
}

function* gotoTask(ctx: Ctx, label: string, target: P2): Script {
  say(`Driving to the ${label}…`);
  yield* goTo(ctx, target, label);
  say(`Arrived at the ${label}.`);
}

function scriptFor(ctx: Ctx, req: TaskRequest): Script {
  switch (req.kind) {
    case "bookshelf":
      return organizeBookshelf(ctx);
    case "cup-bedroom":
      return bringCup(ctx);
    case "vegetables-fridge":
      return organizeVegetables(ctx);
    case "dining-table":
      return arrangeDining(ctx);
    case "arrange-chairs":
      return arrangeChairs(ctx);
    case "door":
      return doorTask(ctx, req.door!.id, req.door!.open);
    case "goto":
      return gotoTask(ctx, req.goto!.label, req.goto!.target);
  }
}

// ---------------- scene component ----------------
export function TaskRunner({ robotRef }: { robotRef: React.RefObject<THREE.Group | null> }) {
  const { scene } = useThree();
  const script = useRef<Script | null>(null);
  const ctxRef = useRef<Ctx | null>(null);

  const dropCarried = (ctx: Ctx) => {
    const c = ctx.carried;
    if (!c) return;
    const floor = ctx.robot.localToWorld(new THREE.Vector3(0, 0, c.kind === "chair" ? 0.62 : 0.45));
    c.obj.position.set(floor.x, 0, floor.z);
    if (c.kind === "chair") setFurniturePose(c.id, { x: floor.x, z: floor.z, rot: c.obj.rotation.y });
    ctx.carried = null;
  };

  const resetScene = (ctx: Ctx) => {
    for (const o of HOUSEHOLD_OBJECTS) {
      const node = scene.getObjectByName(o.id);
      if (node) {
        node.position.set(...o.position);
        node.rotation.set(0, o.rotationY ?? 0, 0);
      }
    }
    for (const f of FURNITURE) {
      const node = scene.getObjectByName(f.id);
      if (node) {
        node.position.set(...f.position);
        node.rotation.set(0, f.rotationY ?? 0, 0);
      }
    }
    resetFurniturePoses();
    resetDoors();
    setFridgeOpen(false);
    ctx.carried = null;
    ctx.robot.position.set(...ROBOT_START.position);
    ctx.robot.rotation.set(0, ROBOT_START.rotationY, 0);
    sendCommand("REST");
    setDisplayPath([]);
  };

  useFrame((_, delta) => {
    const robot = robotRef.current;
    if (!robot) return;
    if (!ctxRef.current) ctxRef.current = { robot, scene, dt: 0, carried: null };
    const ctx = ctxRef.current;
    ctx.dt = Math.min(delta, 0.05) * timeScale;

    for (const c of takeControls()) {
      if (c.type === "start") {
        script.current = scriptFor(ctx, c.request);
      } else if (c.type === "stop") {
        if (script.current) {
          script.current = null;
          dropCarried(ctx);
          sendCommand("REST");
          setDisplayPath([]);
          setTask({ status: "STOPPED" });
          say("Stopped. The robot halted safely where it was.");
        }
      } else if (c.type === "reset") {
        script.current = null;
        resetScene(ctx);
        setTask({ name: "", status: "IDLE", currentItem: 0, totalItems: 0, log: [] });
        say("House reset — everything is back in its starting place.");
      }
    }

    if (script.current) {
      try {
        const r = script.current.next();
        if (r.done) {
          script.current = null;
          setTask({ status: "COMPLETE", currentItem: getTaskSnapshot().totalItems });
        }
      } catch (e) {
        script.current = null;
        dropCarried(ctx);
        sendCommand("REST");
        setDisplayPath([]);
        setTask({ status: "FAILED" });
        say(e instanceof TaskFailed ? e.message : "Something went wrong while doing the task.");
        if (!(e instanceof TaskFailed)) console.error(e);
      }
    }

    if (ctx.carried) ctx.carried.obj.position.copy(handPoint(ctx, ctx.carried.kind));
  });

  return <PathLine />;
}

function PathLine() {
  const path = useDisplayPath();
  if (path.length < 2) return null;
  return <Line points={path.map((p) => [p.x, 0.03, p.z] as [number, number, number])} color="#ff7a3d" lineWidth={3} dashed dashSize={0.18} gapSize={0.1} />;
}
