import { useSyncExternalStore } from "react";

export type DoorId = "study" | "bedroom" | "kitchen" | "entrance";
/** Kept for older imports. */
export type InteriorDoorId = DoorId;

export interface DoorDef {
  id: DoorId;
  label: string;
  /** Wall line (z) the doorway sits in — all doors are in horizontal walls. */
  wallZ: number;
  /** Doorway centre along X. */
  at: number;
  width: number;
  /** +1 = hinge on the west jamb, -1 = hinge on the east jamb. */
  hingeSide: 1 | -1;
  /** Direction (sign of z) the leaf swings into when open. */
  swingZ: 1 | -1;
  /** Room the door leads into (for the robot to pick an approach side). */
  room: string;
}

export const DOORS: DoorDef[] = [
  { id: "bedroom", label: "Bedroom door", wallZ: -0.8, at: -2.6, width: 1.0, hingeSide: 1, swingZ: -1, room: "bedroom" },
  { id: "study", label: "Study door", wallZ: -0.8, at: -0.6, width: 1.0, hingeSide: 1, swingZ: -1, room: "study" },
  { id: "kitchen", label: "Kitchen door", wallZ: -0.8, at: 3.2, width: 1.1, hingeSide: 1, swingZ: -1, room: "kitchen" },
  { id: "entrance", label: "Front door", wallZ: 5, at: 0, width: 1.5, hingeSide: -1, swingZ: -1, room: "garden" },
];

export const DOOR_BY_ID = Object.fromEntries(DOORS.map((d) => [d.id, d])) as Record<DoorId, DoorDef>;

/** Wall-doorway id (layout.ts) → door id. */
export const DOORWAY_TO_DOOR: Record<string, DoorId> = {
  "door-bedroom": "bedroom",
  "door-study": "study",
  "door-kitchen": "kitchen",
  "front-entrance": "entrance",
};

export const INITIAL_DOORS: Record<DoorId, boolean> = { bedroom: false, study: false, kitchen: false, entrance: false };

let state: Record<DoorId, boolean> = { ...INITIAL_DOORS };
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());

export function isDoorOpen(id: DoorId) {
  return state[id];
}
export function getDoorStates() {
  return state;
}
export function setDoorOpen(id: DoorId, open: boolean) {
  if (state[id] === open) return;
  state = { ...state, [id]: open };
  emit();
}
export function toggleDoor(id: DoorId) {
  setDoorOpen(id, !state[id]);
}
export function resetDoors() {
  state = { ...INITIAL_DOORS };
  emit();
}
export function useDoorStates() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getDoorStates,
    getDoorStates,
  );
}

/** Leaf rectangle (axis-aligned) occupied by an OPEN door, for navigation. */
export function openLeafRect(d: DoorDef) {
  const hingeX = d.at - (d.hingeSide * d.width) / 2;
  const z0 = d.wallZ;
  const z1 = d.wallZ + d.swingZ * d.width;
  // The leaf rests just outside the doorway, against the jamb.
  const x0 = hingeX - d.hingeSide * 0.07;
  return { minX: Math.min(x0, hingeX), maxX: Math.max(x0, hingeX), minZ: Math.min(z0, z1), maxZ: Math.max(z0, z1) };
}
