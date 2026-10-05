import { useSyncExternalStore } from "react";
import type { P2 } from "./navigation";

export type TaskKind =
  | "bookshelf"
  | "cup-bedroom"
  | "vegetables-fridge"
  | "dining-table"
  | "arrange-chairs"
  | "door"
  | "goto";

export type TaskStatus = "IDLE" | "RUNNING" | "COMPLETE" | "STOPPED" | "FAILED";

export interface TaskSnapshot {
  name: string;
  status: TaskStatus;
  message: string;
  currentItem: number;
  totalItems: number;
  log: string[];
}

export interface TaskRequest {
  kind: TaskKind;
  name: string;
  door?: { id: import("@/environment/doorManager").DoorId; open: boolean };
  goto?: { label: string; target: P2 };
}

const IDLE: TaskSnapshot = { name: "", status: "IDLE", message: "Ready — pick a task or type a command.", currentItem: 0, totalItems: 0, log: [] };
let snap: TaskSnapshot = IDLE;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export const getTaskSnapshot = () => snap;
export function setTask(partial: Partial<TaskSnapshot>) {
  snap = { ...snap, ...partial };
  emit();
}
export function say(message: string) {
  snap = { ...snap, message, log: [message, ...snap.log].slice(0, 6) };
  emit();
}
export function useTaskSnapshot() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    getTaskSnapshot,
    getTaskSnapshot,
  );
}
export const isBusy = (s: TaskStatus) => s === "RUNNING";

// ---- requests consumed by the in-scene runner ----
export type Control = { type: "start"; request: TaskRequest } | { type: "stop" } | { type: "reset" };
let queue: Control[] = [];
export function takeControls() {
  const q = queue;
  queue = [];
  return q;
}
function push(c: Control) {
  queue.push(c);
}

export function startTask(request: TaskRequest) {
  if (isBusy(snap.status)) return;
  setTask({ name: request.name, status: "RUNNING", currentItem: 0, totalItems: 0, log: [] });
  say(`Starting: ${request.name}`);
  push({ type: "start", request });
}
export function stopTask() {
  push({ type: "stop" });
}
export function resetHouse() {
  push({ type: "reset" });
}

export const TASKS = {
  bookshelf: () => startTask({ kind: "bookshelf", name: "Organize bookshelf" }),
  cup: () => startTask({ kind: "cup-bedroom", name: "Bring cup from kitchen to bedroom" }),
  vegetables: () => startTask({ kind: "vegetables-fridge", name: "Organize vegetables into fridge" }),
  dining: () => startTask({ kind: "dining-table", name: "Arrange the dining table" }),
  chairs: () => startTask({ kind: "arrange-chairs", name: "Arrange the chairs" }),
};

// ---- planned path for on-floor display ----
let path: P2[] = [];
const pathListeners = new Set<() => void>();
export function setDisplayPath(p: P2[]) {
  path = p;
  pathListeners.forEach((l) => l());
}
export function useDisplayPath() {
  return useSyncExternalStore(
    (l) => {
      pathListeners.add(l);
      return () => pathListeners.delete(l);
    },
    () => path,
    () => path,
  );
}

// ---- fridge door ----
let fridgeOpen = false;
const fridgeListeners = new Set<() => void>();
export function setFridgeOpen(open: boolean) {
  fridgeOpen = open;
  fridgeListeners.forEach((l) => l());
}
export const getFridgeOpen = () => fridgeOpen;
export function useFridgeOpen() {
  return useSyncExternalStore(
    (l) => {
      fridgeListeners.add(l);
      return () => fridgeListeners.delete(l);
    },
    getFridgeOpen,
    getFridgeOpen,
  );
}
