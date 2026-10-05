import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import { useRef } from "react";
import type * as THREE from "three";
import { mat } from "./materials";
import { rig } from "./robotState";

const WHEEL_R = 0.17;

function Wheel({ side }: { side: 1 | -1 }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    if (ref.current) ref.current.rotation.x = rig.wheelAngle;
  });
  return (
    <group position={[side * 0.27, WHEEL_R, 0.02]}>
      <group ref={ref}>
        <mesh rotation-z={Math.PI / 2} material={mat.rubber} castShadow>
          <cylinderGeometry args={[WHEEL_R, WHEEL_R, 0.07, 36]} />
        </mesh>
        <mesh rotation-z={Math.PI / 2} position-x={side * 0.036} material={mat.metal}>
          <cylinderGeometry args={[0.11, 0.11, 0.008, 32]} />
        </mesh>
        {[0, 1, 2, 3, 4].map((i) => (
          <mesh key={i} position-x={side * 0.04} rotation-x={(i / 5) * Math.PI * 2} material={mat.dark}>
            <boxGeometry args={[0.006, 0.19, 0.022]} />
          </mesh>
        ))}
        <mesh rotation-z={Math.PI / 2} position-x={side * 0.044} material={mat.accentSoft}>
          <cylinderGeometry args={[0.035, 0.035, 0.012, 24]} />
        </mesh>
      </group>
    </group>
  );
}

export function RobotBase() {
  return (
    <group>
      <RoundedBox args={[0.5, 0.2, 0.52]} radius={0.08} smoothness={4} position={[0, 0.2, 0]} material={mat.shell} castShadow receiveShadow />
      <RoundedBox args={[0.46, 0.05, 0.48]} radius={0.02} position={[0, 0.095, 0]} material={mat.dark} castShadow />
      {/* front bumper + sensor strip */}
      <RoundedBox args={[0.42, 0.05, 0.04]} radius={0.015} position={[0, 0.16, 0.255]} material={mat.dark} />
      <mesh position={[0, 0.16, 0.277]} material={mat.accent}>
        <boxGeometry args={[0.28, 0.008, 0.004]} />
      </mesh>
      {/* vents */}
      {[-1, 0, 1].map((i) => (
        <mesh key={i} position={[i * 0.06, 0.301, -0.12]} material={mat.dark}>
          <boxGeometry args={[0.035, 0.004, 0.12]} />
        </mesh>
      ))}
      <Wheel side={1} />
      <Wheel side={-1} />
      {/* rear caster */}
      <group position={[0, 0, -0.2]}>
        <mesh position-y={0.085} material={mat.metal}>
          <cylinderGeometry args={[0.025, 0.03, 0.04, 16]} />
        </mesh>
        <mesh position={[0, 0.045, -0.015]} rotation-z={Math.PI / 2} material={mat.rubber} castShadow>
          <cylinderGeometry args={[0.045, 0.045, 0.03, 20]} />
        </mesh>
      </group>
    </group>
  );
}
