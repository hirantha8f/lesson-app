"use client";

import { TOPICS } from "@/lib/curriculum";
import { MASTERY_ORDER, type LearnerModel, type MasteryLevel } from "@/lib/learnerModel";

// Student lens on the shared learner model: visible skill map, next-up
// recommendation, streak-as-story chapter.
export function allSkills(): string[] {
  const seen = new Set<string>();
  for (const t of TOPICS) for (const s of t.ct) seen.add(s);
  return [...seen];
}

export function levelFor(m: LearnerModel, skill: string): MasteryLevel {
  return m.mastery[skill]?.level ?? "unseen";
}

export type NextUp =
  | { kind: "misconception"; skill: string; note: string }
  | { kind: "weakest"; skill: string; note: string }
  | { kind: "starter"; note: string };

export function nextUp(m: LearnerModel): NextUp {
  const open = m.misconceptions.find((x) => x.status === "open");
  if (open) {
    return {
      kind: "misconception",
      skill: open.skill,
      note: `Revisit ${open.skill} — last time: ${open.note}`,
    };
  }
  const skills = allSkills();
  let weakest = skills[0];
  for (const s of skills) {
    if (MASTERY_ORDER.indexOf(levelFor(m, s)) < MASTERY_ORDER.indexOf(levelFor(m, weakest))) {
      weakest = s;
    }
  }
  if (levelFor(m, weakest) === "mastered") {
    return { kind: "starter", note: "All skills mastered — spin the wheel for a stretch challenge!" };
  }
  if (Object.keys(m.mastery).length === 0) {
    return { kind: "starter", note: "Start your quest: spin the wheel or drop a code file!" };
  }
  return { kind: "weakest", skill: weakest, note: `Up next: ${weakest} (${levelFor(m, weakest)})` };
}

export default function JourneyMap({ model, streak }: { model: LearnerModel; streak: number }) {
  const rec = nextUp(model);
  return (
    <div className="panel">
      <div className="btnrow" style={{ justifyContent: "space-between", marginTop: 0 }}>
        <strong>Your journey</strong>
        <span className="muted num">Chapter {Math.max(streak, 1)} of your quest</span>
      </div>
      <div className="skillstrip" role="list" aria-label="Skill mastery">
        {allSkills().map((s) => (
          <span key={s} role="listitem" className="skilldot" data-level={levelFor(model, s)} title={`${s}: ${levelFor(model, s)}`}>
            <i />{s}
          </span>
        ))}
      </div>
      <p className="analogy">Next: {rec.note}</p>
    </div>
  );
}
