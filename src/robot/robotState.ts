// Animation/state logic for the robot — kept separate from visual components
// so navigation and task planning can drive it later.
import { useSyncExternalStore } from "react";

export type ArmState = "REST" | "REACH" | "LOWER" | "GRASP" | "LIFT" | "RELEASE";
export type HandState = "OPEN" | "CLOSING" | "GRASP" | "RELEASE";
export type Command = "REST" | "REACH" | "GRASP" | "LIFT" | "RELEASE";

export interface ArmPose {
  shoulderPitch: number; // negative = forward
  shoulderRoll: number; // outward swing
  elbow: number; // negative = bend forward
  wrist: number;
}

export const ARM_POSES: Record<ArmState, ArmPose> = {
  REST: { shoulderPitch: -0.12, shoulderRoll: 0.08, elbow: -0.35, wrist: 0 },
  REACH: { shoulderPitch: -1.25, shoulderRoll: 0.04, elbow: -0.2, wrist: 0.15 },
  LOWER: { shoulderPitch: -0.8, shoulderRoll: 0.04, elbow: -0.55, wrist: 0.35 },
  GRASP: { shoulderPitch: -0.8, shoulderRoll: 0.04, elbow: -0.55, wrist: 0.35 },
  LIFT: { shoulderPitch: -1.15, shoulderRoll: 0.04, elbow: -1.0, wrist: 0.25 },
  RELEASE: { shoulderPitch: -1.2, shoulderRoll: 0.04, elbow: -0.4, wrist: 0.2 },
};

/** Finger curl 0 = open, 1 = fully closed. */
export const HAND_CURL: Record<ArmState, number> = {
  REST: 0.25,
  REACH: 0,
  LOWER: 0,
  GRASP: 0.85,
  LIFT: 0.85,
  RELEASE: 0,
};

/** Live, per-frame interpolated values read by visual components in useFrame. */
export const rig = {
  pose: { ...ARM_POSES.REST } as ArmPose,
  curl: HAND_CURL.REST,
  wheelAngle: 0,
};

interface Snapshot {
  command: Command;
  armState: ArmState;
  handState: HandState;
}

let snap: Snapshot = { command: "REST", armState: "REST", handState: "OPEN" };
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function getSnapshot() {
  return snap;
}
function set(partial: Partial<Snapshot>) {
  const next = { ...snap, ...partial };
  if (next.command === snap.command && next.armState === snap.armState && next.handState === snap.handState) return;
  snap = next;
  emit();
}

export function sendCommand(cmd: Command) {
  // GRASP first lowers the arm, then closes the fingers once the pose is reached.
  set({ command: cmd, armState: cmd === "GRASP" ? "LOWER" : cmd });
}

export function useRobotState() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    getSnapshot,
    getSnapshot,
  );
}

const ARM_K = 4;
const HAND_K = 5;

/** Advance the interpolation; call once per frame. */
export function stepRobot(dt: number) {
  const target = ARM_POSES[snap.armState];
  const a = 1 - Math.exp(-ARM_K * dt);
  let err = 0;
  (Object.keys(target) as (keyof ArmPose)[]).forEach((k) => {
    rig.pose[k] += (target[k] - rig.pose[k]) * a;
    err = Math.max(err, Math.abs(target[k] - rig.pose[k]));
  });

  const targetCurl = HAND_CURL[snap.armState];
  const prevCurl = rig.curl;
  rig.curl += (targetCurl - rig.curl) * (1 - Math.exp(-HAND_K * dt));
  const curlErr = Math.abs(targetCurl - rig.curl);

  if (snap.command === "GRASP" && snap.armState === "LOWER" && err < 0.03) {
    set({ armState: "GRASP" });
  }

  let handState: HandState;
  if (curlErr > 0.02) handState = rig.curl > prevCurl ? "CLOSING" : "RELEASE";
  else handState = rig.curl > 0.6 ? "GRASP" : "OPEN";
  set({ handState });
}
