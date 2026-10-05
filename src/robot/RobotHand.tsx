import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import { useRef } from "react";
import type * as THREE from "three";
import { mat } from "./materials";
import { rig } from "./robotState";

// Hand local frame: fingers extend -Y, palm faces +Z. Curl = negative X rotation.
const SEG = [0.032, 0.026, 0.022];
const MAX_CURL = [1.1, 1.3, 1.0];

function Finger({ x, scale = 1, segRefs }: { x: number; scale?: number; segRefs: React.MutableRefObject<THREE.Group[]> }) {
  const reg = (g: THREE.Group | null) => {
    if (g && !segRefs.current.includes(g)) segRefs.current.push(g);
  };
  const a = SEG[0]! * scale, b = SEG[1]! * scale, c = SEG[2]! * scale;
  return (
    <group position={[x, -0.05, 0]}>
      <group ref={reg} userData={{ i: 0 }}>
        <mesh material={mat.metal} rotation-z={Math.PI / 2}>
          <cylinderGeometry args={[0.008, 0.008, 0.018, 12]} />
        </mesh>
        <mesh position-y={-a / 2} material={mat.shell} castShadow>
          <boxGeometry args={[0.016, a, 0.016]} />
        </mesh>
        <group position-y={-a} ref={reg} userData={{ i: 1 }}>
          <mesh material={mat.dark} rotation-z={Math.PI / 2}>
            <cylinderGeometry args={[0.007, 0.007, 0.017, 10]} />
          </mesh>
          <mesh position-y={-b / 2} material={mat.shell} castShadow>
            <boxGeometry args={[0.015, b, 0.015]} />
          </mesh>
          <group position-y={-b} ref={reg} userData={{ i: 2 }}>
            <mesh material={mat.dark} rotation-z={Math.PI / 2}>
              <cylinderGeometry args={[0.0065, 0.0065, 0.016, 10]} />
            </mesh>
            <mesh position-y={-c / 2} material={mat.shell}>
              <boxGeometry args={[0.014, c, 0.014]} />
            </mesh>
            <mesh position-y={-c} material={mat.rubber}>
              <sphereGeometry args={[0.0075, 10, 10]} />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  );
}

export function RobotHand({ side }: { side: 1 | -1 }) {
  const segs = useRef<THREE.Group[]>([]);
  const thumb = useRef<THREE.Group>(null);
  const thumbTip = useRef<THREE.Group>(null);

  useFrame(() => {
    const c = rig.curl;
    for (const g of segs.current) g.rotation.x = -c * MAX_CURL[g.userData['i'] as number]!;
    if (thumb.current) thumb.current.rotation.x = -c * 0.9;
    if (thumbTip.current) thumbTip.current.rotation.x = -c * 0.9;
  });

  // Palm faces inward toward the robot's centreline.
  return (
    <group rotation-y={-side * Math.PI / 2}>
      <mesh position-y={0.005} material={mat.metal}>
        <sphereGeometry args={[0.022, 16, 16]} />
      </mesh>
      <RoundedBox args={[0.075, 0.06, 0.028]} radius={0.01} position-y={-0.025} material={mat.shell} castShadow />
      <mesh position={[0, -0.025, 0.0145]} material={mat.dark}>
        <boxGeometry args={[0.055, 0.04, 0.002]} />
      </mesh>
      <Finger x={-0.027} scale={0.85} segRefs={segs} />
      <Finger x={-0.009} segRefs={segs} />
      <Finger x={0.009} scale={1.05} segRefs={segs} />
      <Finger x={0.027} scale={0.95} segRefs={segs} />
      {/* thumb on the forward-facing edge of the palm */}
      <group position={[side * 0.04, -0.02, 0.008]} rotation-z={side * 0.6}>
        <group ref={thumb}>
          <mesh material={mat.metal} rotation-z={Math.PI / 2}>
            <cylinderGeometry args={[0.009, 0.009, 0.02, 12]} />
          </mesh>
          <mesh position-y={-0.016} material={mat.shell}>
            <boxGeometry args={[0.018, 0.032, 0.018]} />
          </mesh>
          <group ref={thumbTip} position-y={-0.032}>
            <mesh material={mat.dark} rotation-z={Math.PI / 2}>
              <cylinderGeometry args={[0.008, 0.008, 0.018, 10]} />
            </mesh>
            <mesh position-y={-0.013} material={mat.shell}>
              <boxGeometry args={[0.016, 0.026, 0.016]} />
            </mesh>
            <mesh position-y={-0.026} material={mat.rubber}>
              <sphereGeometry args={[0.008, 10, 10]} />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  );
}
