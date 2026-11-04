"use client";

import { useState } from "react";
import {
  DEFAULT_PROFILE,
  type CodingLevel,
  type LearnerProfile,
} from "@/lib/profile";

export default function ProfilerForm({
  value,
  onChange,
}: {
  value: LearnerProfile;
  onChange: (p: LearnerProfile) => void;
}) {
  const [open, setOpen] = useState(false);
  const set = (patch: Partial<LearnerProfile>) => onChange({ ...value, ...patch });

  return (
    <div className="panel">
      <button className="rowbtn" onClick={() => setOpen((v) => !v)} type="button">
        <span>
          You · age {value.age} · {value.codingLevel} · {value.industry || "general"}
        </span>
        <span style={{ opacity: 0.6 }}>{open ? "▲" : "▼"} personalize</span>
      </button>
      {open && (
        <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
          <label>
            Age (any age — the lesson adapts)
            <input
              type="number"
              min={4}
              max={99}
              value={value.age}
              onChange={(e) => set({ age: Number(e.target.value) || DEFAULT_PROFILE.age })}
            />
          </label>
          <label>
            Education level
            <input
              value={value.eduLevel}
              placeholder={DEFAULT_PROFILE.eduLevel}
              onChange={(e) => set({ eduLevel: e.target.value })}
            />
          </label>
          <label>
            Industry / interests
            <input
              value={value.industry}
              placeholder="healthcare, gaming, retail…"
              onChange={(e) => set({ industry: e.target.value })}
            />
          </label>
          <label>
            Coding experience
            <select
              value={value.codingLevel}
              onChange={(e) => set({ codingLevel: e.target.value as CodingLevel })}
            >
              <option value="new">Brand new</option>
              <option value="some">Some coding</option>
              <option value="confident">Confident</option>
            </select>
          </label>
        </div>
      )}
    </div>
  );
}
