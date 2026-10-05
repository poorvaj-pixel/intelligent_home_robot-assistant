import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import { useRef } from "react";
import type * as THREE from "three";
import { mat } from "./materials";

export function RobotTorso() {
  const status = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (status.current) (status.current.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.2 + Math.sin(clock.elapsedTime * 2) * 0.6;
  });
  return (
    <group position={[0, 0.3, 0]}>
      {/* waist column */}
      <mesh position-y={0.07} material={mat.dark} castShadow>
        <cylinderGeometry args={[0.09, 0.11, 0.14, 24]} />
      </mesh>
      <mesh position-y={0.1} material={mat.metal}>
        <torusGeometry args={[0.1, 0.01, 8, 32]} />
      </mesh>
      {/* body */}
      <RoundedBox args={[0.36, 0.42, 0.26]} radius={0.07} smoothness={4} position={[0, 0.37, 0]} material={mat.shell} castShadow receiveShadow />
      {/* chest panel */}
      <RoundedBox args={[0.22, 0.2, 0.02]} radius={0.01} position={[0, 0.41, 0.132]} material={mat.glass} />
      <mesh ref={status} position={[0, 0.47, 0.144]} material={mat.accent.clone()}>
        <circleGeometry args={[0.022, 24]} />
      </mesh>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[-0.06 + i * 0.06, 0.36, 0.143]} material={mat.accentSoft}>
          <boxGeometry args={[0.035, 0.006, 0.002]} />
        </mesh>
      ))}
      {/* side panels */}
      {[1, -1].map((s) => (
        <group key={s}>
          <RoundedBox args={[0.02, 0.26, 0.18]} radius={0.008} position={[s * 0.181, 0.33, 0]} material={mat.dark} />
          {[0, 1, 2].map((i) => (
            <mesh key={i} position={[s * 0.192, 0.27 + i * 0.05, 0]} material={mat.metal}>
              <boxGeometry args={[0.004, 0.012, 0.12]} />
            </mesh>
          ))}
        </group>
      ))}
      {/* neck */}
      <mesh position-y={0.62} material={mat.dark} castShadow>
        <cylinderGeometry args={[0.045, 0.055, 0.08, 20]} />
      </mesh>
    </group>
  );
}
