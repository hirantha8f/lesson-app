"use client";

import { useMemo, useState } from "react";

function shuffle<T>(xs: T[]): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Faded-Parsons-lite (research-backed): reorder scrambled lines.
export default function Parsons({
  lines, instructions, onXP, onOutcome, skill,
}: {
  lines?: string[];
  instructions?: string;
  onXP: (n: number) => void;
  onOutcome?: (skill: string, success: boolean) => void;
  skill?: string;
}) {
  const solution = useMemo(() => (lines ?? []).filter((l) => l.trim()), [lines]);
  const shuffled = useMemo(() => shuffle(solution), [solution]);
  const [order, setOrder] = useState<string[] | null>(null);
  const [done, setDone] = useState<null | boolean>(null);
  if (!solution.length) return null;
  const current = order ?? shuffled;

  const move = (i: number, dir: -1 | 1) => {
    const next = [...current];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    setOrder(next);
    setDone(null);
  };

  const check = () => {
    const ok = current.every((l, i) => l === solution[i]);
    if (done !== ok) {
      if (ok) onXP(15);
      if (skill) onOutcome?.(skill, ok);
    }
    setDone(ok);
  };

  return (
    <div className="concept">
      <h3 style={{ marginTop: 0 }}>Put it in order</h3>
      {instructions && <p className="muted">{instructions}</p>}
      {current.map((l, i) => (
        <div key={i} className="parson">
          <code>{l || " "}</code>
          <span>
            <button onClick={() => move(i, -1)} disabled={i === 0} type="button" aria-label="move up">↑</button>{" "}
            <button onClick={() => move(i, 1)} disabled={i === current.length - 1} type="button" aria-label="move down">↓</button>
          </span>
        </div>
      ))}
      <div className="btnrow">
        <button onClick={check} type="button">Check order</button>
        <button onClick={() => { setOrder(shuffle(solution)); setDone(null); }} type="button">Reshuffle</button>
      </div>
      {done === true && <p className="good">Correct!</p>}
      {done === false && <p className="error">Not quite — trace the data flow top to bottom and try again.</p>}
    </div>
  );
}
