"use client";

import { useState } from "react";
import { ACTIVITIES, pickActivity, type Activity } from "@/lib/activities";
import JourneyMap, { nextUp } from "./JourneyMap";
import type { LearnerModel } from "@/lib/learnerModel";
import RobotRunner from "./RobotRunner";

export default function ParentPath({ model, streak }: { model?: LearnerModel; streak?: number }) {
  const [age, setAge] = useState(7);
  const [minutes, setMinutes] = useState(10);
  const [device, setDevice] = useState<"none" | "tablet" | "laptop">("none");
  const [activity, setActivity] = useState<Activity | null>(null);

  const surprise = () => setActivity(pickActivity(age, minutes));

  const hasHistory = !!model && (Object.keys(model.mastery).length > 0 || model.misconceptions.length > 0);

  return (
    <div>
      {model && hasHistory && (
        <>
          <JourneyMap model={model} streak={streak ?? 0} age={age} />
          <div className="panel">
            <strong>Tonight{streak ? ` (day ${streak})` : ""}: {nextUp(model).note}</strong>
            {model.narrative.characters.length > 0 && (
              <p className="muted">
                Story so far: {model.narrative.characters.join(", ")}
                {model.narrative.setting ? ` in ${model.narrative.setting}` : ""}.{" "}
                {model.narrative.runningScenario}
              </p>
            )}
            <p className="muted">
              Co-play tip: let them explain each step out loud before touching anything —
              explaining is where the learning sticks.
            </p>
          </div>
        </>
      )}
      <div className="panel">
        <div className="btnrow">
          <label>Child&apos;s age
            <input
              type="number" min={3} max={16} value={age}
              onChange={(e) => setAge(Number(e.target.value) || 7)}
            />
          </label>
          <label>Time you have
            <select value={minutes} onChange={(e) => setMinutes(Number(e.target.value))}>
              <option value={10}>10 min</option>
              <option value={15}>15 min</option>
              <option value={30}>30 min</option>
            </select>
          </label>
          <label>Device?
            <select value={device} onChange={(e) => setDevice(e.target.value as any)}>
              <option value="none">No screen needed</option>
              <option value="tablet">Tablet handy</option>
              <option value="laptop">Laptop handy</option>
            </select>
          </label>
          <button className="primary" onClick={surprise} type="button">Surprise us!</button>
        </div>
      </div>

      {activity && (
        <section style={{ marginTop: 16 }}>
          <h2>{activity.title}</h2>
          <p className="muted">Ages {activity.ages[0]}–{activity.ages[1]} · ~{activity.minutes} min · unplugged first</p>
          <div className="panel">
            <h3 style={{ marginTop: 0 }}>You need</h3>
            <p>{activity.materials.join(" · ")}</p>
          </div>
          <div className="concept">
            <h3 style={{ marginTop: 0 }}>How to play</h3>
            <ol>
              {activity.steps.map((s, i) => <li key={i}>{s}</li>)}
            </ol>
          </div>
          <div className="concept">
            <h3 style={{ marginTop: 0 }}>Ask while you play</h3>
            <ul>
              {activity.ask.map((q, i) => <li key={i}>{q}</li>)}
            </ul>
          </div>
          <p className="analogy">They just learned: {activity.learned}</p>
          {device !== "none" && activity.robot && <RobotRunner challenge={activity.robot} />}
          {device !== "none" && !activity.robot && (
            <p className="muted">No plugged extra for this one — the unplugged game is the whole lesson.</p>
          )}
        </section>
      )}

      <details style={{ marginTop: 16 }}>
        <summary className="muted">Browse all {ACTIVITIES.length} activities</summary>
        <ul>
          {ACTIVITIES.map((a) => (
            <li key={a.id}>
              <button className="linkbtn" onClick={() => setActivity(a)} type="button">{a.title}</button>{" "}
              <span className="muted">ages {a.ages[0]}–{a.ages[1]} · {a.minutes} min</span>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
