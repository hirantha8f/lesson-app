"use client";

import { useState } from "react";
import { TOPICS, getTopic } from "@/lib/curriculum";
import type { StudyGuide } from "@/lib/studyGuide";
import type { LearnerModel } from "@/lib/learnerModel";
import { allSkills, levelFor, nextUp } from "./JourneyMap";
import QuizBlock from "./QuizBlock";

export default function TeacherPath({ model }: { model?: LearnerModel }) {
  const [topicId, setTopicId] = useState(TOPICS[0].id);
  const [level, setLevel] = useState("GCSE (14–16)");
  const [minutes, setMinutes] = useState(60);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guide, setGuide] = useState<StudyGuide | null>(null);
  const [showMarks, setShowMarks] = useState<Record<number, boolean>>({});
  const topic = getTopic(topicId);

  const generate = async () => {
    setError(null);
    setGuide(null);
    setLoading(true);
    try {
      const res = await fetch("/api/guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicId, level, minutes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
      setGuide(data.guide);
    } catch (e: any) {
      setError(e.message ?? "Failed to generate guide.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="panel">
        <h3 style={{ marginTop: 0 }}>Pick a syllabus topic — one map, all boards</h3>
        <div className="topicgrid">
          {TOPICS.map((t) => (
            <button
              key={t.id}
              className={t.id === topicId ? "tab active" : "tab"}
              onClick={() => setTopicId(t.id)}
              type="button"
            >
              {t.title}
            </button>
          ))}
        </div>
        {topic && (
          <>
            <p>{topic.blurb}</p>
            <p>
              {topic.refs.map((r) => (
                <span key={r.board} className="badge">{r.board} {r.ref}</span>
              ))}
            </p>
          </>
        )}
        <div className="btnrow">
          <label>Level
            <select value={level} onChange={(e) => setLevel(e.target.value)}>
              <option>Primary / KS2</option>
              <option>KS3 (11–14)</option>
              <option>GCSE (14–16)</option>
              <option>A-Level / IB</option>
            </select>
          </label>
          <label>Lesson length
            <select value={minutes} onChange={(e) => setMinutes(Number(e.target.value))}>
              <option value={30}>30 min</option>
              <option value={60}>60 min</option>
              <option value={90}>90 min</option>
            </select>
          </label>
          <button className="primary" onClick={generate} disabled={loading} type="button">
            {loading ? "Writing guide…" : "Generate study guide"}
          </button>
        </div>
      </div>

      {model && (model.misconceptions.length > 0 || Object.keys(model.mastery).length > 0) && (
        <div className="panel">
          <strong>Learner lens — same model the student sees</strong>
          {(() => {
            const rec = nextUp(model);
            const open = model.misconceptions.filter((m) => m.status === "open");
            return (
              <>
                <p className="muted">Focus: {rec.note}</p>
                {open.length > 0 && (
                  <ul>
                    {open.map((m) => <li key={m.id}>{m.skill}: {m.note}</li>)}
                  </ul>
                )}
                <p className="muted">
                  Practicing: {allSkills().filter((s) => levelFor(model, s) === "practicing").join(", ") || "—"}
                </p>
                {model.narrative.characters.length > 0 && (
                  <p className="muted">
                    Story world: {model.narrative.characters.join(", ")}
                    {model.narrative.setting ? ` in ${model.narrative.setting}` : ""} — reference it when you set the starter.
                  </p>
                )}
              </>
            );
          })()}
        </div>
      )}

      {error && <p className="error">{error}</p>}

      {guide && (
        <section style={{ marginTop: 24 }}>
          <h2>{guide.topic}</h2>          <p>{guide.summary}</p>
          {guide.pupilVersion && <p className="analogy">Say it to pupils: {guide.pupilVersion}</p>}

          <h3>Key ideas</h3>
          {guide.keyIdeas.map((k, i) => (
            <div className="concept" key={i}>
              <h3 style={{ marginTop: 0 }}>{i + 1}. {k.title}</h3>
              <p>{k.detail}</p>
            </div>
          ))}

          {guide.workedExample && (
            <div className="concept">
              <h3 style={{ marginTop: 0 }}>Whiteboard example: {guide.workedExample.title}</h3>
              <pre><code>{guide.workedExample.code}</code></pre>
              <p className="muted">{guide.workedExample.trace}</p>
            </div>
          )}

          <h3>Misconceptions to pre-empt</h3>
          {guide.misconceptions.map((m, i) => (
            <div className="concept" key={i}>
              <p><strong>Not quite:</strong> <em>{m.myth}</em></p>
              <p><strong>Actually:</strong> {m.reality}</p>
              {m.check && <p className="muted">Diagnostic: {m.check}</p>}
            </div>
          ))}

          <h3>Exam-style questions</h3>
          {guide.examQs.map((q, i) => (
            <div className="quiz-q" key={i}>
              <p><strong>Q{i + 1} [{q.marks} marks]</strong> {q.q}</p>
              <button
                onClick={() => setShowMarks((s) => ({ ...s, [i]: !s[i] }))}
                type="button"
              >
                {showMarks[i] ? "Hide" : "Show"} mark scheme
              </button>
              {showMarks[i] && <p className="muted">{q.markScheme}</p>}
            </div>
          ))}

          <h3>Next-lesson retrieval</h3>
          {guide.retrieval.map((q, i) => (
            <QuizBlock key={i} q={q} index={i} />
          ))}

          {guide.classroomActivity && (
            <div className="concept remix">
              <h3 style={{ marginTop: 0 }}>Class activity ({guide.classroomActivity.minutes} min): {guide.classroomActivity.title}</h3>
              <p style={{ whiteSpace: "pre-wrap" }}>{guide.classroomActivity.steps}</p>
            </div>
          )}

          <div className="panel">
            <p className="muted">Classroom invites (Supabase) land next: create a class, share a code, assign this guide, watch progress.</p>
            <button onClick={() => window.print()} type="button">Print guide</button>
          </div>
        </section>
      )}
    </div>
  );
}
