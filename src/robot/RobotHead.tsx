import { RoundedBox } from "@react-three/drei";
import { mat } from "./materials";

function Lens({ r, x, y }: { r: number; x: number; y: number }) {
  return (
    <group position={[x, y, 0.1]}>
      <mesh rotation-x={Math.PI / 2} material={mat.metal}>
        <cylinderGeometry args={[r * 1.35, r * 1.35, 0.02, 28]} />
      </mesh>
      <mesh position-z={0.011} material={mat.glass}>
        <circleGeometry args={[r, 28]} />
      </mesh>
      <mesh position={[r * 0.3, r * 0.3, 0.012]} material={mat.accent}>
        <circleGeometry args={[r * 0.18, 12]} />
      </mesh>
    </group>
  );
}

export function RobotHead() {
  return (
    <group position={[0, 1.0, 0]}>
      <RoundedBox args={[0.26, 0.14, 0.2]} radius={0.05} smoothness={4} material={mat.shell} castShadow />
      <RoundedBox args={[0.24, 0.09, 0.02]} radius={0.02} position-z={0.095} material={mat.dark} />
      <Lens r={0.03} x={0} y={0} />
      <Lens r={0.014} x={-0.07} y={0.005} />
      <Lens r={0.014} x={0.07} y={0.005} />
      {[-0.1, 0.1].map((x) => (
        <mesh key={x} position={[x, -0.035, 0.106]} material={mat.led}>
          <boxGeometry args={[0.012, 0.006, 0.002]} />
        </mesh>
      ))}
      {/* antenna / lidar puck */}
      <mesh position={[0.07, 0.095, -0.03]} material={mat.dark}>
        <cylinderGeometry args={[0.004, 0.004, 0.06, 8]} />
      </mesh>
      <mesh position={[0.07, 0.127, -0.03]} material={mat.accent}>
        <sphereGeometry args={[0.008, 12, 12]} />
      </mesh>
      <mesh position={[-0.04, 0.08, -0.02]} material={mat.dark}>
        <cylinderGeometry args={[0.035, 0.035, 0.025, 24]} />
      </mesh>
    </group>
  );
}
