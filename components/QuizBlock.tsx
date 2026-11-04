"use client";

import { useEffect, useState } from "react";
import type { LessonQuizQuestion } from "@/lib/prompt";

export default function QuizBlock({
  q, index, onCorrect, onWrong, onDialogueResolve,
}: {
  q: LessonQuizQuestion;
  index: number;
  onCorrect?: (skill?: string) => void;
  onWrong?: (skill?: string, misconception?: string) => void;
  onDialogueResolve?: (skill: string) => void;
}) {
  const [picked, setPicked] = useState<number | null>(null);
  const [followup, setFollowup] = useState<string | null>(null);
  const [asking, setAsking] = useState(false);
  const [resolved, setResolved] = useState<boolean | null>(null);

  // Socratic follow-up on wrong answers; static hint remains the fallback.
  useEffect(() => {
    if (picked === null || picked === q.correctIndex) return;
    let cancelled = false;
    setAsking(true);
    fetch("/api/dialogue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: q.question,
        options: q.options,
        picked,
        correctIndex: q.correctIndex,
        misconception: q.misconception,
        traceHint: q.traceHint,
        skill: q.skill,
      }),
    })
      .then((r) => r.json())
      .then((d) => { if (!cancelled && d.followup) setFollowup(d.followup); })
      .catch(() => { /* fallback: static hint below */ })
      .finally(() => { if (!cancelled) setAsking(false); });
    return () => { cancelled = true; };
  }, [picked, q]);

  const wrong = picked !== null && picked !== q.correctIndex;

  return (
    <div className="quiz-q">
      <p><strong>Q{index + 1}.</strong> {q.question}</p>
      {q.options.map((opt, i) => {
        let cls = "option";
        if (picked !== null) {
          if (i === q.correctIndex) cls += " correct";
          else if (i === picked) cls += " wrong";
        }
        return (
          <button key={i} className={cls} onClick={() => {
            setPicked(i);
            if (i === q.correctIndex) onCorrect?.(q.skill);
            else onWrong?.(q.skill, q.misconception);
          }} disabled={picked !== null} type="button">
            {String.fromCharCode(65 + i)}. {opt}
          </button>
        );
      })}
      {picked !== null && (
        <div style={{ marginTop: 8 }}>
          <p style={{ opacity: 0.9 }}>{q.explanation}</p>
          {wrong && (q.misconception || q.traceHint) && (
            <div className="hint">
              {q.misconception && <p><strong>Common trap:</strong> {q.misconception}</p>}
              {q.traceHint && <p><strong>Re-check the animation:</strong> {q.traceHint}</p>}
            </div>
          )}
          {wrong && asking && <p className="muted">Tutor is thinking of a question…</p>}
          {wrong && followup && resolved === null && (
            <div className="hint">
              <p>{followup}</p>
              <div className="btnrow">
                <button
                  onClick={() => { setResolved(true); if (q.skill) onDialogueResolve?.(q.skill); }}
                  type="button"
                >
                  Got it!
                </button>
                <button onClick={() => setResolved(false)} type="button">Still stuck</button>
              </div>
            </div>
          )}
          {wrong && resolved === true && <p className="good">Nice recovery! +10 XP</p>}
          {picked === q.correctIndex && <p className="good">+10 XP</p>}
        </div>
      )}
    </div>
  );
}
