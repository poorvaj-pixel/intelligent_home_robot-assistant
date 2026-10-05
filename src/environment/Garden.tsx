import { useMemo } from "react";
import * as THREE from "three";
import { envMat } from "./envMaterials";

function Tree({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  const m = envMat();
  return <group position={position} scale={scale}>
    <mesh position-y={0.65} material={m.walnut} castShadow><cylinderGeometry args={[0.13, 0.18, 1.3, 10]} /></mesh>
    <mesh position={[0, 1.45, 0]} material={m.leaf} castShadow><icosahedronGeometry args={[0.7, 1]} /></mesh>
    <mesh position={[0.35, 1.25, 0.05]} material={m.leaf} castShadow><icosahedronGeometry args={[0.48, 1]} /></mesh>
    <mesh position={[-0.3, 1.25, -0.05]} material={m.leaf} castShadow><icosahedronGeometry args={[0.45, 1]} /></mesh>
  </group>;
}

function FlowerBed({ position }: { position: [number, number, number] }) {
  const m = envMat();
  return <group position={position}>
    <mesh rotation-x={-Math.PI / 2} position-y={0.012} material={m.terracotta}><circleGeometry args={[0.65, 24]} /></mesh>
    {[-0.3, 0, 0.3].flatMap((x, i) => [-0.2, 0.2].map((z, j) => (
      <mesh key={`${i}-${j}`} position={[x, 0.16, z]} material={m.flower} castShadow><sphereGeometry args={[0.1, 12, 8]} /></mesh>
    )))}
  </group>;
}

export function Garden() {
  const m = envMat();
  const pathMat = useMemo(() => m.gardenStone.clone(), [m]);
  return <group name="garden">
    <mesh position={[0, -0.03, 7]} rotation-x={-Math.PI / 2} receiveShadow material={m.grass}><planeGeometry args={[28, 24]} /></mesh>
    <mesh position={[0, -0.005, 5.8]} rotation-x={-Math.PI / 2} receiveShadow material={pathMat}><planeGeometry args={[1.7, 2.0]} /></mesh>
    {Array.from({ length: 7 }).map((_, i) => <mesh key={i} position={[-0.7 + (i % 2) * 1.4, 0.01, 6.3 + Math.floor(i / 2) * 0.65]} rotation-x={-Math.PI / 2} material={pathMat}><circleGeometry args={[0.34, 18]} /></mesh>)}
    <Tree position={[-7.2, 0, 6.3]} scale={1.15} />
    <Tree position={[7.1, 0, 6.8]} scale={1.25} />
    <Tree position={[-8.4, 0, 10.3]} scale={0.95} />
    <Tree position={[8.2, 0, 10.0]} scale={1.0} />
    <FlowerBed position={[-3.8, 0, 6.7]} />
    <FlowerBed position={[3.8, 0, 6.7]} />
    {[-5.5, -3.7, 3.7, 5.5].map((x) => <mesh key={x} position={[x, 0.55, 6.0]} material={m.walnut} castShadow><cylinderGeometry args={[0.035, 0.035, 1.1, 8]} /></mesh>)}
    {[-5.5, -3.7, 3.7, 5.5].flatMap((x) => [-0.55, 0.55].map((z) => <mesh key={`${x}-${z}`} position={[x, 0.55, 6.0 + z]} material={m.walnut}><boxGeometry args={[0.035, 1.1, 0.035]} /></mesh>))}
    <mesh position={[0, 0.005, 5.45]} rotation-x={-Math.PI / 2} material={m.terracotta}><planeGeometry args={[1.4, 0.6]} /></mesh>
  </group>;
}
