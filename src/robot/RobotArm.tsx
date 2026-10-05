import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type * as THREE from "three";
import { mat } from "./materials";
import { rig } from "./robotState";
import { RobotHand } from "./RobotHand";

const UPPER = 0.24;
const FORE = 0.22;

function Joint({ r }: { r: number }) {
  return (
    <group>
      <mesh rotation-z={Math.PI / 2} material={mat.dark} castShadow>
        <cylinderGeometry args={[r, r, r * 1.6, 24]} />
      </mesh>
      <mesh rotation-z={Math.PI / 2} material={mat.accentSoft}>
        <cylinderGeometry args={[r * 0.55, r * 0.55, r * 1.7, 20]} />
      </mesh>
    </group>
  );
}

function Link({ length, r }: { length: number; r: number }) {
  return (
    <group position-y={-length / 2}>
      <mesh material={mat.shell} castShadow>
        <capsuleGeometry args={[r, length - r * 2, 6, 16]} />
      </mesh>
      <mesh position-z={r * 0.92} material={mat.dark}>
        <boxGeometry args={[r * 0.6, length * 0.55, 0.004]} />
      </mesh>
    </group>
  );
}

export function RobotArm({ side }: { side: 1 | -1 }) {
  const shoulder = useRef<THREE.Group>(null);
  const elbow = useRef<THREE.Group>(null);
  const wrist = useRef<THREE.Group>(null);

  useFrame(() => {
    const p = rig.pose;
    if (shoulder.current) {
      shoulder.current.rotation.x = p.shoulderPitch;
      shoulder.current.rotation.z = side * p.shoulderRoll;
    }
    if (elbow.current) elbow.current.rotation.x = p.elbow;
    if (wrist.current) wrist.current.rotation.x = p.wrist;
  });

  return (
    <group position={[side * 0.225, 0.85, 0]}>
      {/* shoulder mount */}
      <mesh rotation-z={Math.PI / 2} position-x={-side * 0.02} material={mat.metal}>
        <cylinderGeometry args={[0.05, 0.05, 0.03, 24]} />
      </mesh>
      <group ref={shoulder} rotation-order="ZXY">
        <Joint r={0.042} />
        <Link length={UPPER} r={0.033} />
        <group ref={elbow} position-y={-UPPER}>
          <Joint r={0.034} />
          <Link length={FORE} r={0.028} />
          <group ref={wrist} position-y={-FORE}>
            <Joint r={0.024} />
            <group position-y={-0.02}>
              <RobotHand side={side} />
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}
