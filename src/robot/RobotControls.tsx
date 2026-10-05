import { useState } from "react";
import { sendCommand, useRobotState, type Command } from "./robotState";
import { TASKS, isBusy, resetHouse, startTask, stopTask, useTaskSnapshot } from "./taskStore";
import { DOORS, useDoorStates, type DoorId } from "@/environment/doorManager";

const ARM_COMMANDS: { id: Command; desc: string }[] = [
  { id: "REST", desc: "Arms lowered" },
  { id: "REACH", desc: "Extend arms" },
  { id: "GRASP", desc: "Close fingers" },
  { id: "LIFT", desc: "Raise arms" },
  { id: "RELEASE", desc: "Open fingers" },
];

const PLACES: Record<string, { label: string; target: { x: number; z: number } }> = {
  "living room": { label: "living room", target: { x: -1.2, z: 2.2 } },
  dining: { label: "dining room", target: { x: 2.6, z: 3.0 } },
  kitchen: { label: "kitchen", target: { x: 3.2, z: -1.7 } },
  bedroom: { label: "bedroom", target: { x: -2.6, z: -2.4 } },
  study: { label: "study", target: { x: 0.2, z: -2.4 } },
  corridor: { label: "corridor", target: { x: 0, z: -0.1 } },
  entrance: { label: "entrance", target: { x: 0, z: 4.2 } },
  garden: { label: "garden", target: { x: 0, z: 6.4 } },
};

function runCommand(text: string): string {
  const t = text.trim().toLowerCase();
  if (!t) return "";
  if (/\b(stop|halt|freeze|cancel)\b/.test(t)) return stopTask(), "Stopping.";
  if (/\breset\b/.test(t)) return resetHouse(), "Resetting the house.";
  if (t.includes("book")) return TASKS.bookshelf(), "";
  if (t.includes("cup") || t.includes("mug")) return TASKS.cup(), "";
  if (t.includes("vegetable") || t.includes("fridge") || t.includes("veggies")) return TASKS.vegetables(), "";
  if (t.includes("chair")) return TASKS.chairs(), "";
  if (t.includes("dining table") || t.includes("set the table") || t.includes("table")) return TASKS.dining(), "";
  const door = t.match(/\b(open|close)\b.*?\b(study|bedroom|kitchen|front|entrance|main)\b/);
  if (door) {
    const id: DoorId = door[2] === "front" || door[2] === "main" ? "entrance" : (door[2] as DoorId);
    const open = door[1] === "open";
    startTask({ kind: "door", name: `${open ? "Open" : "Close"} ${id === "entrance" ? "front" : id} door`, door: { id, open } });
    return "";
  }
  const place = Object.keys(PLACES).find((k) => t.includes(k) || (k === "living room" && t.includes("living")));
  if (place) {
    const p = PLACES[place]!;
    startTask({ kind: "goto", name: `Go to the ${p.label}`, goto: p });
    return "";
  }
  return "Sorry, I don't know that command yet.";
}

export function RobotControls({ onResetCamera }: { onResetCamera: () => void }) {
  const s = useRobotState();
  const task = useTaskSnapshot();
  const doors = useDoorStates();
  const [text, setText] = useState("");
  const [hint, setHint] = useState("");
  const busy = isBusy(task.status);

  const submit = () => {
    setHint(runCommand(text));
    setText("");
  };

  const taskButton = (label: string, desc: string, action: () => void) => (
    <button onClick={action} disabled={busy} className="cmd-btn disabled:cursor-not-allowed disabled:opacity-50">
      <span className="text-sm font-semibold">{label}</span>
      <span className="text-xs text-muted-foreground">{desc}</span>
    </button>
  );

  return (
    <div className="flex flex-col gap-6">
      <section className="status-card" data-status={task.status}>
        <div className="flex items-center justify-between gap-2">
          <span className="status-pill">{task.status}</span>
          {task.totalItems > 0 && (
            <span className="font-mono text-[10px] text-muted-foreground">
              {Math.min(task.currentItem, task.totalItems)} / {task.totalItems}
            </span>
          )}
        </div>
        {task.name && <div className="mt-2 text-sm font-semibold">{task.name}</div>}
        <div className="mt-1 text-xs text-muted-foreground">{task.message}</div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button onClick={stopTask} disabled={!busy} className="stop-btn">
            ■ STOP
          </button>
          <button onClick={resetHouse} disabled={busy} className="reset-btn">
            ↺ Reset house
          </button>
        </div>
      </section>

      <section>
        <h2 className="panel-label">Household tasks</h2>
        <div className="mt-3 flex flex-col gap-2">
          {taskButton("Organize bookshelf", "Collect 3 misplaced books and stack them on the shelf", TASKS.bookshelf)}
          {taskButton("Bring cup: kitchen → bedroom", "Pick the cup from the kitchen island, place it by the bed", TASKS.cup)}
          {taskButton("Vegetables → fridge", "Open the fridge, store carrot, tomato and cucumber", TASKS.vegetables)}
          {taskButton("Arrange the dining table", "Set plate, spoon and cup from the sideboard", TASKS.dining)}
          {taskButton("Arrange the chairs", "Tuck all four chairs neatly around the table", TASKS.chairs)}
        </div>
      </section>

      <section>
        <h2 className="panel-label">Doors (robot opens / closes)</h2>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {DOORS.map((d) => {
            const open = doors[d.id];
            return (
              <button
                key={d.id}
                disabled={busy}
                onClick={() => startTask({ kind: "door", name: `${open ? "Close" : "Open"} ${d.label.toLowerCase()}`, door: { id: d.id, open: !open } })}
                className="cmd-btn disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="text-xs font-semibold">
                  {open ? "Close" : "Open"} {d.label.replace(" door", "")}
                </span>
                <span className="text-[10px] text-muted-foreground">Now: {open ? "open" : "closed"}</span>
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">Tip: you can also click a door in the house to open or close it instantly.</p>
      </section>

      <section>
        <h2 className="panel-label">Type a command</h2>
        <div className="mt-3 flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit();
            }}
            placeholder="e.g. organize bookshelf, open study door, stop"
            className="min-w-0 flex-1 rounded-md border border-border bg-muted/40 px-3 py-2 text-xs outline-none focus:border-primary"
          />
          <button onClick={submit} className="rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground hover:bg-primary/90">
            Run
          </button>
        </div>
        {hint && <p className="mt-2 text-[11px] text-muted-foreground">{hint}</p>}
      </section>

      {task.log.length > 1 && (
        <section>
          <h2 className="panel-label">Activity</h2>
          <ul className="mt-2 space-y-1 text-[11px] text-muted-foreground">
            {task.log.map((l, i) => (
              <li key={i} className={i === 0 ? "text-foreground" : ""}>
                {l}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="panel-label">Arm test</h2>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {ARM_COMMANDS.map((c) => (
            <button key={c.id} disabled={busy} onClick={() => sendCommand(c.id)} data-active={s.command === c.id} className="cmd-btn disabled:opacity-50" title={c.desc}>
              <span className="font-mono text-[11px]">{c.id}</span>
            </button>
          ))}
          <button onClick={onResetCamera} className="cmd-btn">
            <span className="font-mono text-[11px]">VIEW</span>
          </button>
        </div>
        <div className="mt-2 font-mono text-[10px] text-muted-foreground">
          ARM {s.armState} · HAND {s.handState}
        </div>
      </section>
    </div>
  );
}
