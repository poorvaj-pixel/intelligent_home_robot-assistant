import { RoundedBox } from "@react-three/drei";
import type * as THREE from "three";
import { FURNITURE_DIMS, type FurnitureItem } from "./layout";
import { envMat } from "./envMaterials";
import { Bookshelf } from "./Bookshelf";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { useFridgeOpen } from "@/robot/taskStore";

/** Fridge with an open front, two shelves and a hinged door the robot can open. */
function Fridge({ w, h, d }: { w: number; h: number; d: number }) {
  const m = envMat();
  const open = useFridgeOpen();
  const door = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (!door.current) return;
    const target = open ? Math.PI / 2 + 0.25 : 0;
    door.current.rotation.y += (target - door.current.rotation.y) * (1 - Math.exp(-5 * Math.min(dt, 0.05)));
  });
  const t = 0.04;
  return (
    <>
      <B p={[-w / 2 + t / 2, h / 2, 0]} s={[t, h, d - 0.06]} m={m.steel} />
      <B p={[w / 2 - t / 2, h / 2, 0]} s={[t, h, d - 0.06]} m={m.steel} />
      <B p={[0, h - t / 2, 0]} s={[w, t, d - 0.06]} m={m.steel} />
      <B p={[0, 0.06, 0]} s={[w, 0.12, d - 0.06]} m={m.steel} />
      <B p={[0, h / 2, -d / 2 + 0.05]} s={[w, h, t]} m={m.fridgeInside} />
      {[0.55, 0.97, 1.4].map((y) => (
        <B key={y} p={[0, y - 0.01, 0]} s={[w - 2 * t, 0.02, d - 0.12]} m={m.fridgeInside} />
      ))}
      <group ref={door} position={[w / 2, 0, d / 2 - 0.03]}>
        <B p={[-w / 2, h / 2, 0.03]} s={[w, h - 0.02, 0.06]} m={m.steel} r={0.02} />
        <B p={[-w + 0.08, 1.2, 0.08]} s={[0.025, 0.45, 0.025]} m={m.black} />
      </group>
    </>
  );
}

type P3 = [number, number, number];

function B({ p, s, m, r = 0 }: { p: P3; s: P3; m: THREE.Material; r?: number }) {
  if (r > 0)
    return <RoundedBox args={s} radius={r} smoothness={3} position={p} material={m} castShadow receiveShadow />;
  return (
    <mesh position={p} material={m} castShadow receiveShadow>
      <boxGeometry args={s} />
    </mesh>
  );
}

function Legs({ w, d, h, inset = 0.05, m, t = 0.04 }: { w: number; d: number; h: number; inset?: number; m: THREE.Material; t?: number }) {
  const xs = [-w / 2 + inset, w / 2 - inset];
  const zs = [-d / 2 + inset, d / 2 - inset];
  return (
    <>
      {xs.flatMap((x) => zs.map((z) => <B key={`${x}${z}`} p={[x, h / 2, z]} s={[t, h, t]} m={m} />))}
    </>
  );
}

function Table({ w, h, d, top, legs }: { w: number; h: number; d: number; top: THREE.Material; legs: THREE.Material }) {
  return (
    <>
      <B p={[0, h - 0.02, 0]} s={[w, 0.04, d]} m={top} r={0.01} />
      <Legs w={w} d={d} h={h - 0.04} m={legs} />
    </>
  );
}

function Seat({ w, d, h, m, legs }: { w: number; d: number; h: number; m: THREE.Material; legs: THREE.Material }) {
  return (
    <>
      <Legs w={w} d={d} h={0.43} m={legs} t={0.03} />
      <B p={[0, 0.46, 0]} s={[w, 0.06, d]} m={m} r={0.015} />
      <B p={[0, (0.49 + h) / 2, -d / 2 + 0.03]} s={[w, h - 0.49, 0.04]} m={m} r={0.015} />
    </>
  );
}

function Body({ kind }: { kind: FurnitureItem["kind"] }) {
  const m = envMat();
  const [w, h, d] = FURNITURE_DIMS[kind];
  switch (kind) {
    case "sofa":
      return (
        <>
          <B p={[0, 0.06, 0]} s={[w - 0.1, 0.12, d - 0.1]} m={m.black} />
          <B p={[0, 0.27, 0.05]} s={[w - 0.3, 0.3, d - 0.15]} m={m.fabric} r={0.05} />
          <B p={[0, 0.58, -d / 2 + 0.12]} s={[w - 0.3, 0.55, 0.24]} m={m.fabric} r={0.06} />
          {[-1, 1].map((sd) => (
            <B key={sd} p={[sd * (w / 2 - 0.08), 0.33, 0]} s={[0.16, 0.42, d]} m={m.fabric} r={0.05} />
          ))}
          {[-0.45, 0.45].map((x) => (
            <B key={x} p={[x, 0.47, 0.08]} s={[0.78, 0.1, d - 0.3]} m={m.fabric} r={0.04} />
          ))}
        </>
      );
    case "armchair":
      return (
        <>
          <B p={[0, 0.25, 0.03]} s={[w - 0.2, 0.3, d - 0.1]} m={m.fabricWarm} r={0.05} />
          <B p={[0, 0.55, -d / 2 + 0.1]} s={[w - 0.1, 0.6, 0.2]} m={m.fabricWarm} r={0.06} />
          {[-1, 1].map((sd) => (
            <B key={sd} p={[sd * (w / 2 - 0.07), 0.32, 0]} s={[0.14, 0.4, d]} m={m.fabricWarm} r={0.05} />
          ))}
          <Legs w={w} d={d} h={0.1} m={m.walnut} t={0.04} />
        </>
      );
    case "coffeeTable":
      return (
        <>
          <Table w={w} h={h} d={d} top={m.oak} legs={m.black} />
          <B p={[0, 0.12, 0]} s={[w - 0.1, 0.02, d - 0.1]} m={m.oak} />
        </>
      );
    case "sideTable":
    case "bedsideTable":
      return (
        <>
          <B p={[0, h / 2, 0]} s={[w, h, d]} m={kind === "sideTable" ? m.oak : m.white} r={0.02} />
          <B p={[0, h * 0.6, d / 2 + 0.002]} s={[w * 0.6, 0.02, 0.01]} m={m.steel} />
        </>
      );
    case "floorLamp":
      return (
        <>
          <B p={[0, 0.015, 0]} s={[0.3, 0.03, 0.3]} m={m.black} r={0.01} />
          <B p={[0, 0.75, 0]} s={[0.025, 1.45, 0.025]} m={m.black} />
          <mesh position-y={1.45} material={m.lampGlow}>
            <cylinderGeometry args={[0.13, 0.2, 0.26, 24, 1, true]} />
          </mesh>
          <pointLight position={[0, 1.4, 0]} intensity={1.2} distance={4} color="#ffcf8f" />
        </>
      );
    case "plant":
      return (
        <>
          <mesh position-y={0.18} material={m.ceramic} castShadow>
            <cylinderGeometry args={[0.18, 0.14, 0.36, 20]} />
          </mesh>
          {[[0, 0.65, 0, 0.25], [0.1, 0.85, 0.05, 0.18], [-0.08, 0.9, -0.06, 0.16]].map(([x, y, z, r], i) => (
            <mesh key={i} position={[x!, y!, z!]} material={m.leaf} castShadow>
              <icosahedronGeometry args={[r!, 1]} />
            </mesh>
          ))}
        </>
      );
    case "diningTable":
      return <Table w={w} h={h} d={d} top={m.walnut} legs={m.black} />;
    case "diningChair":
      return <Seat w={w} d={d} h={h} m={m.oak} legs={m.black} />;
    case "deskChair":
      return (
        <>
          <mesh position-y={0.04} material={m.black}>
            <cylinderGeometry args={[0.25, 0.25, 0.03, 5]} />
          </mesh>
          <B p={[0, 0.25, 0]} s={[0.04, 0.4, 0.04]} m={m.steel} />
          <B p={[0, 0.48, 0]} s={[w, 0.07, d]} m={m.black} r={0.02} />
          <B p={[0, 0.75, -d / 2 + 0.04]} s={[w - 0.05, 0.45, 0.05]} m={m.black} r={0.02} />
        </>
      );
    case "counter":
    case "island":
      return (
        <>
          <B p={[0, (h - 0.04) / 2, 0]} s={[w, h - 0.04, d - 0.02]} m={m.white} />
          <B p={[0, h - 0.02, 0.01]} s={[w + 0.02, 0.04, d]} m={m.stone} />
          {Array.from({ length: Math.round(w / 0.6) }).map((_, i, a) => {
            const x = -w / 2 + (w / a.length) * (i + 0.5);
            return <B key={i} p={[x, h - 0.15, d / 2 - 0.005]} s={[0.18, 0.015, 0.015]} m={m.steel} />;
          })}
          {kind === "counter" && (
            <mesh position={[-0.6, h + 0.002, 0]} rotation-x={-Math.PI / 2} material={m.steel}>
              <planeGeometry args={[0.5, 0.36]} />
            </mesh>
          )}
        </>
      );
    case "upperCabinet":
      return (
        <>
          <B p={[0, h / 2, 0]} s={[w, h, d]} m={m.white} />
          {Array.from({ length: 4 }).map((_, i) => (
            <B key={i} p={[-w / 2 + (w / 4) * (i + 0.5), 0.07, d / 2 + 0.005]} s={[0.12, 0.012, 0.012]} m={m.steel} />
          ))}
        </>
      );
    case "fridge":
      return <Fridge w={w} h={h} d={d} />;
    case "bed":
      return (
        <>
          <B p={[0, 0.15, 0]} s={[w, 0.25, d]} m={m.oak} r={0.02} />
          <B p={[0, 0.36, 0.02]} s={[w - 0.06, 0.18, d - 0.06]} m={m.linen} r={0.04} />
          <B p={[0, 0.47, 0.35]} s={[w - 0.04, 0.05, d * 0.6]} m={m.blanket} r={0.02} />
          <B p={[0, 0.5, -d / 2 + 0.03]} s={[w, 0.9, 0.06]} m={m.oak} r={0.02} />
          {[-0.4, 0.4].map((x) => (
            <B key={x} p={[x, 0.5, -d / 2 + 0.25]} s={[0.55, 0.12, 0.3]} m={m.white} r={0.05} />
          ))}
        </>
      );
    case "wardrobe":
      return (
        <>
          <B p={[0, h / 2, 0]} s={[w, h, d]} m={m.white} r={0.01} />
          <B p={[0, h / 2, d / 2 + 0.002]} s={[0.006, h - 0.1, 0.004]} m={m.black} />
          {[-0.06, 0.06].map((x) => (
            <B key={x} p={[x, h / 2, d / 2 + 0.02]} s={[0.02, 0.3, 0.02]} m={m.steel} />
          ))}
        </>
      );
    case "desk":
      return (
        <>
          <B p={[0, h - 0.02, 0]} s={[w, 0.04, d]} m={m.oak} r={0.01} />
          <B p={[w / 2 - 0.22, (h - 0.04) / 2, 0]} s={[0.4, h - 0.04, d - 0.04]} m={m.white} />
          <B p={[-w / 2 + 0.03, (h - 0.04) / 2, 0]} s={[0.04, h - 0.04, d - 0.04]} m={m.black} />
          <B p={[-0.15, h + 0.17, -d / 2 + 0.1]} s={[0.55, 0.32, 0.03]} m={m.black} />
          <B p={[-0.15, h + 0.06, -d / 2 + 0.12]} s={[0.04, 0.1, 0.04]} m={m.black} />
        </>
      );
    case "bookshelf":
      return null;
  }
}

export function Furniture({ item }: { item: FurnitureItem }) {
  return (
    <group name={item.id} position={item.position} rotation-y={item.rotationY ?? 0} userData={{ kind: item.kind, obstacle: item.obstacle }}>
      {item.kind === "bookshelf" ? <Bookshelf id={`${item.id}-frame`} /> : <Body kind={item.kind} />}
    </group>
  );
}
