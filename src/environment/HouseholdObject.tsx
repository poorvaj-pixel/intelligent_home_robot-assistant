import * as THREE from "three";
import type { HouseholdObjectItem } from "./layout";
import { envMat } from "./envMaterials";

export function HouseholdObject({ item }: { item: HouseholdObjectItem }) {
  const m = envMat();
  let body: React.ReactNode = null;
  switch (item.kind) {
    case "book":
      body = (
        <group>
          <mesh position-y={0.02} castShadow>
            <boxGeometry args={[0.17, 0.04, 0.24]} />
            <meshStandardMaterial color={item.color ?? "#8c3b2e"} roughness={0.8} />
          </mesh>
          <mesh position={[0.005, 0.02, 0]} material={m.linen}>
            <boxGeometry args={[0.165, 0.032, 0.232]} />
          </mesh>
        </group>
      );
      break;
    case "box":
      body = (
        <mesh position-y={0.11} material={m.cardboard} castShadow>
          <boxGeometry args={[0.3, 0.22, 0.25]} />
        </mesh>
      );
      break;
    case "cup":
      body = (
        <group>
          <mesh position-y={0.045} material={m.ceramic} castShadow>
            <cylinderGeometry args={[0.035, 0.03, 0.09, 20]} />
          </mesh>
          <mesh position={[0.042, 0.05, 0]} rotation-z={Math.PI / 2} material={m.ceramic}>
            <torusGeometry args={[0.02, 0.006, 8, 16]} />
          </mesh>
        </group>
      );
      break;
    case "remote":
      body = (
        <group>
          <mesh position-y={0.01} material={m.black} castShadow>
            <boxGeometry args={[0.05, 0.02, 0.17]} />
          </mesh>
          <mesh position={[0, 0.021, 0.05]} material={m.lampGlow}>
            <boxGeometry args={[0.012, 0.002, 0.012]} />
          </mesh>
        </group>
      );
      break;
    case "vase":
      body = (
        <group>
          <mesh position-y={0.1} material={m.ceramic} castShadow>
            <cylinderGeometry args={[0.04, 0.06, 0.2, 20]} />
          </mesh>
          <mesh position-y={0.25} material={m.leaf}>
            <sphereGeometry args={[0.08, 10, 8]} />
          </mesh>
        </group>
      );
      break;
    case "bottle":
      body = (
        <mesh position-y={0.12} castShadow>
          <cylinderGeometry args={[0.035, 0.035, 0.24, 16]} />
          <meshStandardMaterial color="#3f6b5a" roughness={0.15} transparent opacity={0.85} />
        </mesh>
      );
      break;
    case "vegetable":
      body = (
        <mesh position-y={0.05} material={new THREE.MeshStandardMaterial({ color: item.color ?? "#6aa85f", roughness: 0.75 })} castShadow>
          <sphereGeometry args={[0.065, 16, 10]} scale={[1.35, 0.8, 0.8]} />
        </mesh>
      );
      break;
    case "plate":
      body = (
        <mesh rotation-x={-Math.PI / 2} position-y={0.025} material={m.ceramic} castShadow>
          <cylinderGeometry args={[0.17, 0.14, 0.025, 32]} />
        </mesh>
      );
      break;
    case "spoon":
      body = (
        <group rotation-y={0.15}>
          <mesh position={[0, 0.012, 0]} material={m.steel} castShadow><boxGeometry args={[0.025, 0.018, 0.18]} /></mesh>
          <mesh position={[0, 0.022, 0.085]} material={m.steel}><sphereGeometry args={[0.035, 12, 8]} /></mesh>
        </group>
      );
      break;
    case "lamp":
      body = (
        <group>
          <mesh position-y={0.1} material={m.black}>
            <cylinderGeometry args={[0.01, 0.05, 0.2, 12]} />
          </mesh>
          <mesh position-y={0.25} material={m.lampGlow}>
            <cylinderGeometry args={[0.06, 0.09, 0.12, 20, 1, true]} />
          </mesh>
        </group>
      );
      break;
  }
  return (
    <group name={item.id} position={item.position} rotation-y={item.rotationY ?? 0} userData={{ kind: item.kind, organizable: item.organizable }}>
      {body}
    </group>
  );
}
