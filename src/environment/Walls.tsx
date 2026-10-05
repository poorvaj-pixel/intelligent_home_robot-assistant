import { WALL_HEIGHT, WALL_THICKNESS, type Doorway, type Wall } from "./layout";
import { envMat } from "./envMaterials";

function Segment({ a, b, horizontal, fixed, id }: { a: number; b: number; horizontal: boolean; fixed: number; id: string }) {
  const m = envMat();
  const len = b - a;
  if (len <= 0.01) return null;
  const c = (a + b) / 2;
  const pos: [number, number, number] = horizontal ? [c, WALL_HEIGHT / 2, fixed] : [fixed, WALL_HEIGHT / 2, c];
  const size: [number, number, number] = horizontal ? [len, WALL_HEIGHT, WALL_THICKNESS] : [WALL_THICKNESS, WALL_HEIGHT, len];
  return (
    <group name={id}>
      <mesh position={pos} material={m.wall} castShadow receiveShadow>
        <boxGeometry args={size} />
      </mesh>
      <mesh position={[pos[0], WALL_HEIGHT + 0.01, pos[2]]} material={m.wallCap}>
        <boxGeometry args={[size[0] + 0.002, 0.02, size[2] + 0.002]} />
      </mesh>
    </group>
  );
}

/** Marks a doorway opening with thin glowing floor strips at its edges. */
export function DoorwayMarker({ door, horizontal, fixed }: { door: Doorway; horizontal: boolean; fixed: number }) {
  const m = envMat();
  const half = door.width / 2;
  return (
    <group name={door.id}>
      {[-half, half].map((o) => (
        <mesh
          key={o}
          position={horizontal ? [door.at + o, 0.004, fixed] : [fixed, 0.004, door.at + o]}
          material={m.doorFrame}
        >
          <boxGeometry args={horizontal ? [0.03, 0.006, WALL_THICKNESS + 0.06] : [WALL_THICKNESS + 0.06, 0.006, 0.03]} />
        </mesh>
      ))}
    </group>
  );
}

export function Walls({ walls }: { walls: Wall[] }) {
  return (
    <group name="walls">
      {walls.map((w) => {
        const horizontal = w.from[1] === w.to[1];
        const fixed = horizontal ? w.from[1] : w.from[0];
        const start = horizontal ? Math.min(w.from[0], w.to[0]) : Math.min(w.from[1], w.to[1]);
        const end = horizontal ? Math.max(w.from[0], w.to[0]) : Math.max(w.from[1], w.to[1]);
        const doors = [...(w.doors ?? [])].sort((p, q) => p.at - q.at);
        const pieces: [number, number][] = [];
        let cur = start - (horizontal ? WALL_THICKNESS / 2 : 0);
        for (const d of doors) {
          pieces.push([cur, d.at - d.width / 2]);
          cur = d.at + d.width / 2;
        }
        pieces.push([cur, end + (horizontal ? WALL_THICKNESS / 2 : 0)]);
        return (
          <group key={w.id} name={w.id}>
            {pieces.map(([a, b], i) => (
              <Segment key={i} id={`${w.id}-seg-${i}`} a={a} b={b} horizontal={horizontal} fixed={fixed} />
            ))}
            {doors.map((d) => (
              <DoorwayMarker key={d.id} door={d} horizontal={horizontal} fixed={fixed} />
            ))}
          </group>
        );
      })}
    </group>
  );
}
