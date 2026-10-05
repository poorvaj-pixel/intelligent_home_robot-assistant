import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer, OrbitControls } from "@react-three/drei";
import { forwardRef, useImperativeHandle, useRef, type MutableRefObject } from "react";
import * as THREE from "three";
import type { OrbitControls as OrbitImpl } from "three-stdlib";
import { Robot } from "./Robot";
import { TaskRunner } from "./TaskRunner";
import { House } from "@/environment/House";
import { RoomLabelOverlay, RoomLabelProjector } from "@/environment/RoomLabels";
import { CAMERA_VIEWS, ROBOT_START, type CameraView } from "@/environment/layout";

const DEFAULT_VIEW = CAMERA_VIEWS.find((v) => v.id === "overview")!;

export interface ViewportHandle {
  resetCamera: () => void;
  flyTo: (viewId: string) => void;
}

type Goal = { pos: THREE.Vector3; target: THREE.Vector3 } | null;

function CameraFlyer({ controls, goal }: { controls: MutableRefObject<OrbitImpl | null>; goal: MutableRefObject<Goal> }) {
  useFrame((_, d) => {
    const c = controls.current;
    const g = goal.current;
    if (!c || !g) return;
    const a = 1 - Math.exp(-4 * Math.min(d, 0.05));
    c.object.position.lerp(g.pos, a);
    c.target.lerp(g.target, a);
    c.update();
    if (c.object.position.distanceTo(g.pos) < 0.02 && c.target.distanceTo(g.target) < 0.02) goal.current = null;
  });
  return null;
}

export const RobotViewport = forwardRef<ViewportHandle, { showLabels: boolean }>(function RobotViewport({ showLabels }, ref) {
  const controls = useRef<OrbitImpl>(null);
  const goal = useRef<Goal>(null);
  const labelRefs = useRef<(HTMLDivElement | null)[]>([]);
  const robotRef = useRef<THREE.Group>(null);
  const go = (v: CameraView) => {
    goal.current = { pos: new THREE.Vector3(...v.position), target: new THREE.Vector3(...v.target) };
  };
  useImperativeHandle(ref, () => ({
    resetCamera: () => go(DEFAULT_VIEW),
    flyTo: (id) => {
      const v = CAMERA_VIEWS.find((x) => x.id === id);
      if (v) go(v);
    },
  }));

  return (
    <div className="absolute inset-0">
    <Canvas shadows dpr={[1, 2]} camera={{ position: DEFAULT_VIEW.position, fov: 45, near: 0.05, far: 80 }}>
      <color attach="background" args={["#bfe8ff"]} />
      <fog attach="fog" args={["#bfe8ff", 30, 60]} />
      <ambientLight intensity={0.35} />
      <hemisphereLight args={["#ffffff", "#b8d8a8", 1.15]} />
      <directionalLight position={[6, 12, 7]} intensity={2.6} color="#fff6e0" castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0003} shadow-normalBias={0.02}>
        <orthographicCamera attach="shadow-camera" args={[-8, 8, 8, -8, 0.5, 30]} />
      </directionalLight>
      <directionalLight position={[-5, 5, -4]} intensity={0.5} color="#c5ddff" />
      <Environment resolution={256}>
        <Lightformer intensity={1.5} color="#fff1dc" position={[0, 5, 0]} scale={[10, 10, 1]} rotation-x={Math.PI / 2} />
        <Lightformer intensity={0.8} color="#9cc4ff" position={[-5, 1, -1]} rotation-y={Math.PI / 2} scale={[20, 1, 1]} />
        <Lightformer intensity={0.6} position={[5, 1, 2]} rotation-y={-Math.PI / 2} scale={[20, 2, 1]} />
      </Environment>

      <House />
      <RoomLabelProjector refs={labelRefs} />
      <group ref={robotRef} name="robot" position={ROBOT_START.position} rotation-y={ROBOT_START.rotationY}>
        <Robot />
      </group>
      <TaskRunner robotRef={robotRef} />

      {/* ground outside the house */}
      <mesh rotation-x={-Math.PI / 2} position-y={-0.01} receiveShadow>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color="#86d06a" roughness={1} />
      </mesh>
      <OrbitControls
        ref={controls}
        target={DEFAULT_VIEW.target}
        enableDamping
        minDistance={0.8}
        maxDistance={25}
        maxPolarAngle={Math.PI / 2 - 0.05}
        makeDefault
        onStart={() => (goal.current = null)}
      />
      <CameraFlyer controls={controls} goal={goal} />
    </Canvas>
    <RoomLabelOverlay refs={labelRefs} visible={showLabels} />
    </div>
  );
});
