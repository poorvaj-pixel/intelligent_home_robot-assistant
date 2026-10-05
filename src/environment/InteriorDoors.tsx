import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type * as THREE from "three";
import { DOORS, toggleDoor, useDoorStates, type DoorDef } from "./doorManager";
import { envMat } from "./envMaterials";

const DOOR_H = 1.62;

function Door({ d, open }: { d: DoorDef; open: boolean }) {
  const m = envMat();
  const leaf = useRef<THREE.Group>(null);
  const hingeX = d.at - (d.hingeSide * d.width) / 2;
  // Rotating about Y by θ maps local +X to z = -x·sinθ. Pick the sign that swings into swingZ.
  const openAngle = -d.swingZ * d.hingeSide * (Math.PI / 2);
  const leafColor = d.id === "study" ? m.doorBlue : d.id === "bedroom" ? m.doorPink : d.id === "kitchen" ? m.doorYellow : m.doorGreen;

  useFrame((_, dt) => {
    if (!leaf.current) return;
    const target = open ? openAngle : 0;
    leaf.current.rotation.y += (target - leaf.current.rotation.y) * (1 - Math.exp(-6 * Math.min(dt, 0.05)));
  });

  const w = d.width - 0.04;
  return (
    <group name={`${d.id}-door`}>
      {/* frame */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[d.at + (s * d.width) / 2, DOOR_H / 2 + 0.05, d.wallZ]} material={m.doorFrame} castShadow>
          <boxGeometry args={[0.06, DOOR_H + 0.1, 0.14]} />
        </mesh>
      ))}
      <mesh position={[d.at, DOOR_H + 0.1, d.wallZ]} material={m.doorFrame}>
        <boxGeometry args={[d.width + 0.06, 0.08, 0.14]} />
      </mesh>
      {/* hinged leaf */}
      <group ref={leaf} position={[hingeX + d.hingeSide * 0.02, 0, d.wallZ]}>
        <group
          position={[(d.hingeSide * w) / 2, 0, 0]}
          onClick={(e) => {
            e.stopPropagation();
            toggleDoor(d.id);
          }}
        >
          <mesh position-y={DOOR_H / 2 + 0.02} material={leafColor} castShadow receiveShadow>
            <boxGeometry args={[w, DOOR_H, 0.05]} />
          </mesh>
          {[0.45, 1.15].map((y) => (
            <mesh key={y} position={[0, y, 0]} material={m.white}>
              <boxGeometry args={[w * 0.7, 0.5, 0.056]} />
            </mesh>
          ))}
          {[-1, 1].map((s) => (
            <mesh key={s} position={[(-d.hingeSide * w) / 2 + d.hingeSide * 0.09, 0.9, s * 0.045]} material={m.steel}>
              <sphereGeometry args={[0.035, 14, 10]} />
            </mesh>
          ))}
        </group>
      </group>
    </group>
  );
}

export function InteriorDoors() {
  const doors = useDoorStates();
  return (
    <group name="doors">
      {DOORS.map((d) => (
        <Door key={d.id} d={d} open={doors[d.id]} />
      ))}
    </group>
  );
}
