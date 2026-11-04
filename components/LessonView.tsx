"use client";

import { useState } from "react";
import type { Lesson } from "@/lib/prompt";
import { lessonToMarkdown } from "@/lib/markdown";
import type { Difficulty } from "@/lib/profile";
import { DIFFICULTY_META } from "@/lib/profile";
import QuizBlock from "./QuizBlock";
import { Tracer, Visual } from "./VisualTracer";
import Playground from "./Playground";
import Parsons from "./Parsons";

export default function LessonView({
  filename, lesson, sourceLabel, difficulty, onDifficulty, onXP, onOutcome, onDialogueResolve, xp, streak,
}: {
  filename: string;
  lesson: Lesson;
  sourceLabel: string;
  difficulty: Difficulty;
  onDifficulty: (d: Difficulty) => void;
  onXP: (n: number) => void;
  onOutcome?: (skill: string, success: boolean, misconception?: string) => void;
  onDialogueResolve?: (skill: string) => void;
  xp: number;
  streak: number;
}) {
  const [teacher, setTeacher] = useState(false);

  const download = (withTeacher: boolean) => {
    const md = lessonToMarkdown(filename, lesson, { includeTeacher: withTeacher });
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename.replace(/\.[^.]+$/, "")}-lesson${withTeacher ? "-worksheet" : ""}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const share = async () => {
    const url = `${location.origin}${location.pathname}?lesson=${encodeURIComponent(filename)}&level=${difficulty}`;
    try {
      await navigator.clipboard.writeText(url);
      alert("Share link copied! (Regenerates this lesson for a friend.)");
    } catch {
      prompt("Copy this link:", url);
    }
  };

  return (
    <section style={{ marginTop: 32 }} className={teacher ? "teacher" : ""}>
      <div className="btnrow" style={{ justifyContent: "space-between" }}>
        <span className="muted">{sourceLabel} · <span className="num">{xp} XP · {streak}d streak</span></span>
        <span className="btnrow">
          <button onClick={() => setTeacher((v) => !v)} type="button">
            {teacher ? "Student view" : "Teacher mode"}
          </button>
          <button onClick={share} type="button">Share</button>
        </span>
      </div>

      <h2>{filename}</h2>
      <p><em>{lesson.language}</em></p>
      {lesson.hook && <p className="hook">{lesson.hook}</p>}
      <p>{lesson.fileSummary}</p>
      {lesson.analogy && <p className="analogy">For you: {lesson.analogy}</p>}

      {/* Suggestion 2: difficulty ladder — same file, 3 reading levels */}
      <div className="panel">
        <span className="muted">Reading level: </span>
        {(Object.keys(DIFFICULTY_META) as Difficulty[]).map((d) => (
          <button
            key={d}
            onClick={() => d !== difficulty && onDifficulty(d)}
            disabled={d === difficulty}
            type="button"
            title={DIFFICULTY_META[d].hint}
          >
            {DIFFICULTY_META[d].label}{d === difficulty ? " (current)" : ""}
          </button>
        ))}
      </div>

      {!teacher ? (
        <>
          <h3>Key Concepts</h3>
          {lesson.concepts.map((c, i) => (
            <div className="concept" key={i}>
              <h3 style={{ marginTop: 0 }}>{c.title}</h3>
              <p>{c.explanation}</p>
              <pre><code>{c.codeRef}</code></pre>
            </div>
          ))}

          <h3>See it</h3>
          <Visual spec={lesson.visual} />
          <Tracer steps={lesson.traceSteps} />

          <h3>Do it</h3>
          <Playground spec={lesson.playground} onXP={onXP} />
          <Parsons lines={lesson.parsons?.lines} instructions={lesson.parsons?.instructions} onXP={onXP} />

          <h3>Walkthrough</h3>
          <p style={{ whiteSpace: "pre-wrap" }}>{lesson.walkthrough}</p>

          <h3>Check yourself</h3>
          {lesson.quiz.map((q, i) => (
            <QuizBlock
              key={i}
              q={q}
              index={i}
              onCorrect={(skill) => { onXP(10); if (skill) onOutcome?.(skill, true); }}
              onWrong={(skill, misconception) => { if (skill) onOutcome?.(skill, false, misconception); }}
              onDialogueResolve={(skill) => { onXP(10); onDialogueResolve?.(skill); }}
            />
          ))}

          {lesson.remix?.title && (
            <div className="concept remix">
              <h3 style={{ marginTop: 0 }}>Remix: {lesson.remix.title}</h3>
              <p>{lesson.remix.brief}</p>
              <p className="muted">Done when: {lesson.remix.successCriteria}</p>
              <button onClick={() => onXP(20)} type="button">I shipped it! +20 XP</button>
            </div>
          )}

          <div className="btnrow" style={{ marginTop: 20 }}>
            <button onClick={() => download(false)} type="button">Download .md</button>
          </div>
        </>
      ) : (
        <>
          {/* Suggestion 4: teacher worksheet from the same JSON */}
          <h3>Teacher worksheet — print this</h3>
          <h4>Objectives</h4>
          <ul>{(lesson.objectives ?? []).map((o, i) => <li key={i}>{o}</li>)}</ul>
          <h4>Vocab</h4>
          <dl>{(lesson.vocab ?? []).map((v, i) => <div key={i}><dt><strong>{v.term}</strong></dt><dd>{v.def}</dd></div>)}</dl>
          <h4>Discussion prompt</h4>
          <p>{lesson.discussion}</p>
          <h4>Quiz answer key</h4>
          <ol>{lesson.quiz.map((q, i) => <li key={i}>{String.fromCharCode(65 + q.correctIndex)}. {q.options[q.correctIndex]} — {q.explanation}</li>)}</ol>
          <div className="btnrow">
            <button onClick={() => window.print()} type="button">Print</button>
            <button onClick={() => download(true)} type="button">Download worksheet .md</button>
          </div>
        </>
      )}
    </section>
  );
}
