"use client";

import { useState } from "react";
import type { TraceStep, VisualSpec } from "@/lib/prompt";

export function Visual({ spec }: { spec?: VisualSpec }) {
  if (!spec?.nodes?.length) return null;
  return (
    <div className="concept">
      <h3 style={{ marginTop: 0 }}>How it flows</h3>
      <div className="flow">
        {(spec.nodes ?? []).map((n, i) => (
          <div key={n.id} className="flownode">
            <span className="flowbadge">{i + 1}</span> {n.label}
            {i < (spec.nodes?.length ?? 0) - 1 && <span className="flowarrow">↓</span>}
          </div>
        ))}
      </div>
      {spec.caption && <p className="muted">{spec.caption}</p>}
      {(spec.edges ?? []).length > 0 && (
        <details>
          <summary className="muted">Edge details</summary>
          <ul>
            {(spec.edges ?? []).map((e, i) => (
              <li key={i}><code>{e.from} → {e.to}</code>{e.label ? ` — ${e.label}` : ""}</li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

// Suggestion 1 core: animation as step-through tracer, not video.
export function Tracer({ steps }: { steps?: TraceStep[] }) {
  const [idx, setIdx] = useState(0);
  if (!steps?.length) return null;
  const safeIdx = Math.min(Math.max(idx, 0), steps.length - 1);
  const s = steps[safeIdx];
  if (!s) return null;
  return (
    <div className="concept">
      <h3 style={{ marginTop: 0 }}>Step-through ({safeIdx + 1}/{steps.length})</h3>
      <p><strong>{s.step}</strong></p>
      {s.lineRef && <pre><code>{s.lineRef}</code></pre>}
      {!!s.vars && Object.keys(s.vars).length > 0 && (
        <table className="vartable">
          <tbody>
            {Object.entries(s.vars).map(([k, v]) => (
              <tr key={k}><td><code>{k}</code></td><td><code>{v}</code></td></tr>
            ))}
          </tbody>
        </table>
      )}
      {s.note && <p className="muted">{s.note}</p>}
      <div className="btnrow">
        <button onClick={() => setIdx((i) => Math.max(0, i - 1))} disabled={safeIdx === 0} type="button">← Prev</button>
        <input
          type="range" min={0} max={steps.length - 1} value={safeIdx}
          onChange={(e) => setIdx(Number(e.target.value))} aria-label="trace step"
          style={{ flex: 1 }}
        />
        <button onClick={() => setIdx((i) => Math.min(steps.length - 1, i + 1))} disabled={safeIdx === steps.length - 1} type="button">Next →</button>
      </div>
    </div>
  );
}
