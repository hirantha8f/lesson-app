"use client";

import { PERSONAS, type Persona } from "@/lib/persona";

export default function PersonaPicker({ onPick }: { onPick: (p: Persona) => void }) {
  return (
    <div>
      <h1>Who is learning today?</h1>
      <p className="muted">One Primer, three doors. Pick a path — switch anytime from the rail.</p>
      <div className="personagrid">
        {PERSONAS.map((p) => (
          <button key={p.id} className="personacard" onClick={() => onPick(p.id)} type="button">
            <strong>{p.title}</strong>
            <span className="muted">{p.promise}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
