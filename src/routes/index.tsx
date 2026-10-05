import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { CAMERA_VIEWS } from "@/environment/layout";
import { RobotViewport, type ViewportHandle } from "@/robot/RobotViewport";
import { RobotControls } from "@/robot/RobotControls";
import { isBusy, stopTask, useTaskSnapshot } from "@/robot/taskStore";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Intelligent Home Service Robot — 3D Simulator" },
      { name: "description", content: "A 3D home robot that organizes books, carries cups, stores vegetables, sets the table, arranges chairs and opens doors." },
      { property: "og:title", content: "Intelligent Home Service Robot — 3D Simulator" },
      { property: "og:description", content: "Watch a home robot plan collision-free paths and complete household tasks." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const vp = useRef<ViewportHandle>(null);
  const [labels, setLabels] = useState(true);
  const task = useTaskSnapshot();
  return (
    <main className="flex h-screen flex-col bg-background text-foreground md:flex-row">
      <aside className="order-2 w-full shrink-0 overflow-y-auto border-t border-border bg-card p-5 md:order-1 md:w-80 md:border-r md:border-t-0">
        <p className="font-mono text-[10px] tracking-[0.3em] text-primary">SMART HOME ROBOT</p>
        <h1 className="mt-1 text-xl font-semibold leading-tight">Intelligent Home Service Robot</h1>
        <p className="mb-5 mt-1 text-xs text-muted-foreground">Plans safe paths around walls and furniture · opens doors on its own</p>
        <RobotControls onResetCamera={() => vp.current?.resetCamera()} />
      </aside>
      <div className="relative order-1 min-h-[55vh] flex-1 md:order-2">
        <RobotViewport ref={vp} showLabels={labels} />
        <nav className="view-bar">
          {CAMERA_VIEWS.map((v) => (
            <button key={v.id} className="view-chip" onClick={() => vp.current?.flyTo(v.id)}>
              {v.label}
            </button>
          ))}
          <button className="view-chip" data-active={labels} onClick={() => setLabels((l) => !l)}>
            Labels
          </button>
        </nav>
        {isBusy(task.status) && (
          <button onClick={stopTask} className="stop-btn stop-float">
            ■ STOP ROBOT
          </button>
        )}
      </div>
    </main>
  );
}
