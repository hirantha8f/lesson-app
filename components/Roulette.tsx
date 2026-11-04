"use client";

import { useEffect, useRef, useState } from "react";
import { ROULETTE_ITEMS, spinRoulette, type RouletteItem } from "@/lib/roulette";

const CATS = ["Any", "Games", "Web", "AI", "Algorithms"] as const;

export default function Roulette({
  onPick,
  spinning,
}: {
  onPick: (item: RouletteItem) => void;
  spinning: boolean;
}) {
  const [cat, setCat] = useState<(typeof CATS)[number]>("Any");
  const [display, setDisplay] = useState("Press spin for a surprise lesson");
  const [last, setLast] = useState<RouletteItem | null>(null);
  const spinTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => {
    if (spinTimer.current) clearInterval(spinTimer.current);
  }, []);

  const spin = () => {
    if (spinTimer.current) clearInterval(spinTimer.current);
    // Slot-machine flicker, then settle on the real pick.
    let ticks = 0;
    const iv = setInterval(() => {
      const r = spinRoulette(cat === "Any" ? "Any" : cat);
      setDisplay(`… ${r.title}`);
      if (++ticks > 8) {
        clearInterval(iv);
        spinTimer.current = null;
        const final = spinRoulette(cat === "Any" ? "Any" : cat);
        setDisplay(`» ${final.title}`);
        setLast(final);
        onPick(final);
      }
    }, 90);
    spinTimer.current = iv;
  };

  return (
    <div className="panel roulette">
      <div className="slot" aria-live="polite">
        {spinning ? "Cooking your lesson…" : display}
      </div>
      {last && <p className="muted">{last.whyFun} <em>({last.repo})</em></p>}
      <div className="btnrow">
        <select value={cat} onChange={(e) => setCat(e.target.value as any)} aria-label="category">
          {CATS.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <button className="primary" onClick={spin} disabled={spinning} type="button">
          {spinning ? "Spinning…" : "Spin — surprise me"}
        </button>
      </div>
      <details>
        <summary className="muted">Browse all {ROULETTE_ITEMS.length} picks</summary>
        <ul>
          {ROULETTE_ITEMS.map((r) => (
            <li key={r.id}>
              <button className="linkbtn" onClick={() => { setLast(r); setDisplay(`» ${r.title}`); onPick(r); }} type="button">
                {r.title}
              </button>{" "}
              <span className="muted">[{r.category} · {r.concept}]</span>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
