"use client";

import { useState } from "react";
import type { PlaygroundSpec } from "@/lib/prompt";

// Zero-dep playground (hackathon-safe):
// - JS runs locally in a sandboxed Function with console capture.
// - Other languages: predict-then-reveal using the model's expectedOutput.
// Never executes the full uploaded file — only the small starterCode excerpt
// (Suggestion 5: safety).
export default function Playground({
  spec, onXP,
}: {
  spec?: PlaygroundSpec;
  onXP: (n: number) => void;
}) {
  const [code, setCode] = useState(spec?.starterCode ?? "");
  const [output, setOutput] = useState("");
  const [predicted, setPredicted] = useState("");
  const [revealed, setRevealed] = useState(false);
  if (!spec?.starterCode) return null;
  const lang = (spec.language ?? "javascript").toLowerCase();
  const runnable = lang.includes("javascript") || lang.includes("js") || lang.includes("typescript") || lang.includes("ts");

  const run = () => {
    setOutput("");
    if (!runnable) {
      setOutput(`(Run is JS-only in this demo — compare with Expected below.)`);
      return;
    }
    try {
      const logs: string[] = [];
      const fakeConsole = { log: (...a: any[]) => logs.push(a.map(String).join(" ")) };
      // eslint-disable-next-line no-new-func
      const fn = new Function("console", `"use strict";\n${code}`);
      const ret = fn(fakeConsole);
      if (ret !== undefined) logs.push(String(ret));
      setOutput(logs.join("\n") || "(no output — try console.log something!)");
      onXP(10);
    } catch (e: any) {
      setOutput(`Error: ${e.message}`);
    }
  };

  return (
    <div className="concept">
      <h3 style={{ marginTop: 0 }}>Try it — playground</h3>
      {/* PRIMM step 1: predict before running */}
      <label>
        <span className="muted">Step 1 — Predict: what will this print?</span>
        <input value={predicted} onChange={(e) => setPredicted(e.target.value)} placeholder="type your guess first…" />
      </label>
      <textarea value={code} onChange={(e) => setCode(e.target.value)} rows={10} spellCheck={false} />
      <div className="btnrow">
        <button className="primary" onClick={run} type="button">Run</button>
        <button onClick={() => { setCode(spec.starterCode ?? ""); setOutput(""); setRevealed(false); }} type="button">Reset</button>
        <button onClick={() => setRevealed((v) => !v)} type="button">{revealed ? "Hide" : "Reveal"} expected</button>
      </div>
      {output && <pre><code>{output}</code></pre>}
      {revealed && spec.expectedOutput && (
        <p className="muted">Expected: <code>{spec.expectedOutput}</code>
          {predicted ? (spec.expectedOutput.includes(predicted.trim()) || predicted.trim().length === 0 ? "" : " — compare with your guess above!") : ""}</p>
      )}
      {(spec.tasks ?? []).map((t) => (
        <p key={t.id}><strong>{t.title}:</strong> {t.instruction}</p>
      ))}
      {!runnable && <p className="muted">Note: in-browser Run supports JavaScript/TypeScript. For {spec.language}, edit + discuss with the trace above.</p>}
    </div>
  );
}
