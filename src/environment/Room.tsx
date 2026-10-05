import { useMemo } from "react";
import * as THREE from "three";
import type { Room as RoomData } from "./layout";
import { envMat } from "./envMaterials";

export function Room({ room }: { room: RoomData }) {
  const w = room.max[0] - room.min[0];
  const d = room.max[1] - room.min[1];
  const cx = (room.min[0] + room.max[0]) / 2;
  const cz = (room.min[1] + room.max[1]) / 2;

  const material = useMemo(() => {
    const base = envMat().floor[room.floor];
    const tex = base.clone();
    tex.needsUpdate = true;
    const scale = room.floor === "wood" ? 1.6 : room.floor === "tile" ? 1.2 : 2;
    tex.repeat.set(w / scale, d / scale);
    return new THREE.MeshStandardMaterial({ map: tex, roughness: room.floor === "tile" ? 0.35 : 0.7 });
  }, [room.floor, w, d]);

  return (
    <group name={`room-${room.id}`}>
      <mesh position={[cx, 0, cz]} rotation-x={-Math.PI / 2} material={material} receiveShadow>
        <planeGeometry args={[w, d]} />
      </mesh>
    </group>
  );
}
