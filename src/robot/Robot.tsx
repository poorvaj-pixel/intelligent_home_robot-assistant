import { useFrame } from "@react-three/fiber";
import { RobotBase } from "./RobotBase";
import { RobotTorso } from "./RobotTorso";
import { RobotHead } from "./RobotHead";
import { RobotArm } from "./RobotArm";
import { stepRobot } from "./robotState";

function Animator() {
  useFrame((_, d) => stepRobot(Math.min(d, 0.05)));
  return null;
}

export function Robot() {
  return (
    <group>
      <Animator />
      <RobotBase />
      <RobotTorso />
      <RobotHead />
      <RobotArm side={1} />
      <RobotArm side={-1} />
    </group>
  );
}
