"use client";

import { useCallback, useEffect, useState } from "react";
import type { Lesson } from "@/lib/prompt";
import {
  DEFAULT_PROFILE,
  addXP,
  difficultyForProfile,
  getStreak,
  getXP,
  loadProfile,
  saveProfile,
  type Difficulty,
  type LearnerProfile,
} from "@/lib/profile";
import { loadPersona, savePersona, type Persona } from "@/lib/persona";
import { accessToken, pushLearnerModel, syncLearnerModel } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import {
  emptyLearnerModel,
  extendNarrative,
  loadLocalModel,
  logMisconception,
  recordOutcome,
  saveLocalModel,
  type LearnerModel,
} from "@/lib/learnerModel";
import type { RouletteItem } from "@/lib/roulette";
import ProfilerForm from "@/components/ProfilerForm";
import JourneyMap from "@/components/JourneyMap";
import AuthPanel from "@/components/AuthPanel";
import { StudentClasses, TeacherClassrooms, recordQuizProgress } from "@/components/ClassroomPanel";
import Roulette from "@/components/Roulette";
import LessonView from "@/components/LessonView";
import PersonaPicker from "@/components/PersonaPicker";
import TeacherPath from "@/components/TeacherPath";
import ParentPath from "@/components/ParentPath";

type Tab = "roulette" | "github" | "upload";

// Parse an API response without leaking raw SyntaxErrors when the server
// returns an HTML error page (stale dev cache, proxy error, deploy hiccup).
async function parseJsonResponse(res: Response): Promise<any> {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(
      `Server returned an unexpected response (${res.status}). If you just ran a build, restart the dev server and try again.`
    );
  }
}

export default function Home() {
  const [persona, setPersona] = useState<Persona | null>(null);
  const [tab, setTab] = useState<Tab>("roulette");
  const [profile, setProfile] = useState<LearnerProfile>(DEFAULT_PROFILE);
  const [difficulty, setDifficulty] = useState<Difficulty>("cs1");
  const [githubUrl, setGithubUrl] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filename, setFilename] = useState<string | null>(null);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [sourceLabel, setSourceLabel] = useState("");
  const [lastCode, setLastCode] = useState("");
  const [lastRouletteId, setLastRouletteId] = useState<string | null>(null);
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [learner, setLearner] = useState<LearnerModel>(emptyLearnerModel());
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    setPersona(loadPersona());
    setLearner(loadLocalModel());
    const saved = loadProfile();
    if (saved) {
      setProfile(saved);
      setDifficulty(difficultyForProfile(saved));
    }
    setXp(getXP());
    setStreak(getStreak());
  }, []);

  const pickPersona = (p: Persona) => {
    setPersona(p);
    savePersona(p);
  };

  const updateProfile = (p: LearnerProfile) => {
    setProfile(p);
    saveProfile(p);
    setDifficulty(difficultyForProfile(p));
  };

  const bumpXP = useCallback((n: number) => {
    setXp(addXP(n));
    setStreak(getStreak());
  }, []);

  // Sign-in: merge anonymous-local model into the server row (server wins).
  const handleAuth = useCallback(async (u: User | null) => {
    setUser(u);
    if (!u) return;
    try {
      const merged = await syncLearnerModel(u.id, loadLocalModel());
      saveLocalModel(merged);
      setLearner(merged);
    } catch {
      /* offline: local model stands */
    }
  }, []);

  // Persist locally always; push to Supabase when signed in (durable model).
  const persistModel = useCallback(
    (m: LearnerModel) => {
      saveLocalModel(m);
      setLearner(m);
      if (user) pushLearnerModel(user.id, m).catch(() => { /* best effort */ });
    },
    [user]
  );

  const request = useCallback(
    async (payload: Record<string, unknown>, label: string) => {
      setError(null);
      setLesson(null);
      setLoading(true);
      try {
        const token = await accessToken().catch(() => null);
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;
        const res = await fetch("/api/lesson", {
          method: "POST",
          headers,
          body: JSON.stringify({ ...payload, profile, difficulty: payload.difficulty ?? difficulty, learner }),
        });
        const data = await parseJsonResponse(res);
        if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
        setLesson(data.lesson);
        setFilename(data.filename);
        setSourceLabel(label);
        if (data.code) setLastCode(data.code);
        // Primer continuity: seed narrative from the fresh lesson and stamp
        // the session so the next generation callbacks to this one.
        if (data.lesson) {
          const seeded = extendNarrative(learner, data.lesson.storySeed);
          seeded.lastSession = {
            ref: data.filename ?? "lesson",
            at: new Date().toISOString(),
            callback: data.lesson.hook ?? data.lesson.fileSummary ?? "",
          };
          // Narrative continuity: the running scenario advances each chapter.
          if (data.lesson.hook) {
            seeded.narrative = { ...seeded.narrative, runningScenario: data.lesson.hook };
          }
          persistModel(seeded);
        }
      } catch (e: any) {
        setError(e.message ?? "Failed to generate lesson.");
      } finally {
        setLoading(false);
      }
    },
    [profile, difficulty, learner, persistModel]
  );

  // Session outcome -> learner model -> journey refresh, no reload.
  // Server applies the transition; local fallback keeps it working offline.
  const handleOutcome = useCallback(
    async (skill: string, success: boolean, misconception?: string) => {
      try {
        const res = await fetch("/api/outcome", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ learner, skill, success, logNote: misconception }),
        });
        const data = await res.json();
        if (!res.ok || !data.model) throw new Error("outcome failed");
        persistModel(data.model);
        if (success) recordQuizProgress(`lesson:${filename ?? "unknown"}`, 10);
      } catch {
        let next = recordOutcome(learner, { skill, success });
        if (!success && misconception) next = logMisconception(next, skill, misconception);
        persistModel(next);
      }
    },
    [learner, persistModel, filename]
  );

  // Dialogue resolution: correct follow-up resolves the linked misconception.
  const handleDialogueResolve = useCallback(
    async (skill: string) => {
      try {
        const open = learner.misconceptions.find((m) => m.status === "open" && m.skill === skill);
        const res = await fetch("/api/outcome", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ learner, skill, success: true, misconceptionId: open?.id }),
        });
        const data = await res.json();
        if (!res.ok || !data.model) throw new Error("outcome failed");
        persistModel(data.model);
      } catch {
        const { resolveDialogue } = await import("@/lib/learnerModel");
        const next = resolveDialogue(learner, skill);
        persistModel(next);
      }
    },
    [learner, persistModel]
  );

  const handleRoulette = useCallback(
    (item: RouletteItem) => {
      setLastRouletteId(item.id);
      setLastCode(item.code);
      request({ rouletteId: item.id }, `${item.title} · ${item.repo}`);
    },
    [request]
  );

  const handleGithub = () => {
    if (!githubUrl.trim()) return;
    setLastRouletteId(null);
    request({ githubUrl: githubUrl.trim() }, "GitHub import");
  };

  const handleFile = useCallback(
    async (file: File) => {
      const code = await file.text();
      setLastCode(code);
      setLastRouletteId(null);
      request({ filename: file.name, code }, "upload");
    },
    [request]
  );

  const changeDifficulty = useCallback(
    (d: Difficulty) => {
      setDifficulty(d);
      if (!lastCode && !lastRouletteId) return;
      const payload: Record<string, unknown> = { difficulty: d, profile };
      if (lastRouletteId) payload.rouletteId = lastRouletteId;
      else payload.code = lastCode;
      if (!payload.rouletteId && !payload.code) return;
      payload.filename = filename ?? "lesson";
      request(payload, `${sourceLabel} · ${d}`);
    },
    [lastCode, lastRouletteId, filename, sourceLabel, profile, request]
  );

  return (
    <div className="shell">
      <aside className="rail">
        <p className="wordmark">Learn From Code<small>a Primer that grows with you</small></p>
        {persona && (
          <>
            {(["student", "teacher", "parent"] as Persona[]).map((p) => (
              <button
                key={p}
                className={persona === p ? "navitem active" : "navitem"}
                onClick={() => pickPersona(p)}
                type="button"
              >
                {p === "student" ? "Student" : p === "teacher" ? "Teacher" : "Parent"}
              </button>
            ))}
            {persona === "student" && (
              <div className="railfoot num">{xp} XP · {streak}d streak</div>
            )}
          </>
        )}
      </aside>
      <div className="body">
        <header className="topbar">
          <span className="muted">
            {persona === null
              ? "Choose your path"
              : persona === "student"
                ? "Student path"
                : persona === "teacher"
                  ? "Teacher path"
                  : "Parent path"}
          </span>
          <span className="spacer" />
          <a href="/marimo"><button type="button">Marimo lab</button></a>
          {persona === "student" && (
            <span className="stat"><strong>{xp}</strong> XP · <strong>{streak}</strong>d</span>
          )}
        </header>
        <main>
      <AuthPanel onAuth={handleAuth} />

      {!persona ? (
        <PersonaPicker onPick={pickPersona} />
      ) : (
        <>
          {persona === "teacher" && (
            <>
              <h1>Which topic are we teaching?</h1>
              <TeacherPath model={learner} />
              <TeacherClassrooms user={user} />
            </>
          )}
          {persona === "parent" && (
            <>
              <h1>What are we playing today?</h1>
              <ParentPath model={learner} streak={streak} />
            </>
          )}

          {persona === "student" && (
            <>
              <h1>What are we learning today?</h1>
              <p>
                Spin the wheel, paste a GitHub file, or drop your own — get a lesson with
                visuals, step-through animation, playground + quiz.
              </p>

              <ProfilerForm value={profile} onChange={updateProfile} />

              <JourneyMap model={learner} streak={streak} age={profile.age} />
              <StudentClasses user={user} />

              <div className="tabs" role="tablist">
                {(["roulette", "github", "upload"] as Tab[]).map((t) => (
                  <button
                    key={t}
                    role="tab"
                    aria-selected={tab === t}
                    className={tab === t ? "tab active" : "tab"}
                    onClick={() => setTab(t)}
                    type="button"
                  >
                    {t === "roulette" ? "Roulette" : t === "github" ? "GitHub" : "Upload"}
                  </button>
                ))}
              </div>

              {tab === "roulette" && <Roulette onPick={handleRoulette} spinning={loading} />}

              {tab === "github" && (
                <div className="panel">
                  <p className="muted">Paste any public file URL, e.g. <code>github.com/.../blob/main/src/index.ts</code></p>
                  <div className="btnrow">
                    <input
                      value={githubUrl}
                      onChange={(e) => setGithubUrl(e.target.value)}
                      placeholder="https://github.com/owner/repo/blob/main/path/file.ts"
                      style={{ flex: 1 }}
                    />
                    <button className="primary" onClick={handleGithub} disabled={loading || !githubUrl.trim()} type="button">
                      {loading ? "Cooking…" : "Make lesson"}
                    </button>
                  </div>
                </div>
              )}

              {tab === "upload" && (
                <div
                  className={`dropzone${dragActive ? " active" : ""}`}
                  onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragActive(false);
                    const f = e.dataTransfer.files?.[0];
                    if (f) handleFile(f);
                  }}
                  onClick={() => document.getElementById("fileInput")?.click()}
                >
                  {loading ? "Generating lesson…" : "Drag a code file here, or click to choose one"}
                  <input
                    id="fileInput"
                    type="file"
                    hidden
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                  />
                </div>
              )}

              {error && <p className="error">{error}</p>}
              {loading && !lesson && <p className="muted">Reading your code, tailoring to age {profile.age} · {profile.industry}…</p>}

              {lesson && filename && (
                <LessonView
                  filename={filename}
                  lesson={lesson}
                  sourceLabel={sourceLabel}
                  difficulty={difficulty}
                  onDifficulty={changeDifficulty}
                  onXP={bumpXP}
                  onOutcome={handleOutcome}
                  onDialogueResolve={handleDialogueResolve}
                  onDialogueStuck={(skill) => handleOutcome(skill, false)}
                  xp={xp}
                  streak={streak}
                />
              )}
            </>
          )}
        </>
      )}
        </main>
      </div>
    </div>
  );
}
