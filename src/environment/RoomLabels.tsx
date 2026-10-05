import { useFrame, useThree } from "@react-three/fiber";
import { useRef, type MutableRefObject } from "react";
import * as THREE from "three";
import { ROOMS } from "./layout";

export const LABELED_ROOMS = ROOMS.filter((r) => r.labeled);

/** DOM overlay of room names; positions are written by <RoomLabelProjector/>. */
export function RoomLabelOverlay({ refs, visible }: { refs: MutableRefObject<(HTMLDivElement | null)[]>; visible: boolean }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" style={{ display: visible ? undefined : "none" }}>
      {LABELED_ROOMS.map((r, i) => (
        <div key={r.id} ref={(el) => void (refs.current[i] = el)} className="room-label absolute left-0 top-0" style={{ opacity: 0 }}>
          {r.name}
        </div>
      ))}
    </div>
  );
}

const v = new THREE.Vector3();
export function RoomLabelProjector({ refs }: { refs: MutableRefObject<(HTMLDivElement | null)[]> }) {
  const { camera, size } = useThree();
  const centers = useRef(LABELED_ROOMS.map((r) => new THREE.Vector3((r.min[0] + r.max[0]) / 2, 0.05, (r.min[1] + r.max[1]) / 2)));
  useFrame(() => {
    centers.current.forEach((c, i) => {
      const el = refs.current[i];
      if (!el) return;
      v.copy(c).project(camera);
      const on = v.z < 1 && Math.abs(v.x) < 1.1 && Math.abs(v.y) < 1.1;
      el.style.opacity = on ? "1" : "0";
      const x = (v.x * 0.5 + 0.5) * size.width;
      const y = (-v.y * 0.5 + 0.5) * size.height;
      el.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px)`;
    });
  });
  return null;
}
