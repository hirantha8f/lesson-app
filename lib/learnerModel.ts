// Primer learner model: durable per-learner state.
// Anonymous-first: localStorage mirror (lfc-learner-v1) is fully functional
// standalone; merged into the server row on sign-in (server wins conflicts,
// client fills gaps). Mirrors the learner_models Supabase table.

export type MasteryLevel = "unseen" | "seen" | "practicing" | "mastered";

export type SkillMastery = {
  level: MasteryLevel;
  successes: number;
  updatedAt: string;
};

export type Misconception = {
  id: string;
  skill: string;
  note: string;
  status: "open" | "resolved";
  createdAt: string;
};

export type Narrative = {
  characters: string[];
  setting: string;
  runningScenario: string;
};

export type LearnerModel = {
  mastery: Record<string, SkillMastery>;
  misconceptions: Misconception[];
  narrative: Narrative;
  interests: string[];
  lastSession: { ref: string; at: string; callback: string } | null;
};

export const MASTERY_ORDER: MasteryLevel[] = ["unseen", "seen", "practicing", "mastered"];

export function emptyLearnerModel(): LearnerModel {
  return {
    mastery: {},
    misconceptions: [],
    narrative: { characters: [], setting: "", runningScenario: "" },
    interests: [],
    lastSession: null,
  };
}

const KEY = "lfc-learner-v1";

export function loadLocalModel(): LearnerModel {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyLearnerModel();
    return { ...emptyLearnerModel(), ...JSON.parse(raw) };
  } catch {
    return emptyLearnerModel();
  }
}

export function saveLocalModel(m: LearnerModel) {
  try {
    localStorage.setItem(KEY, JSON.stringify(m));
  } catch {
    /* ignore */
  }
}

// Server wins on conflicts; local fills gaps (newer lastSession wins).
export function mergeModels(server: LearnerModel, local: LearnerModel): LearnerModel {  const mastery: Record<string, SkillMastery> = { ...local.mastery };
  for (const [skill, s] of Object.entries(server.mastery)) {
    const l = mastery[skill];
    if (!l || MASTERY_ORDER.indexOf(s.level) >= MASTERY_ORDER.indexOf(l.level)) {
      mastery[skill] = { ...s, successes: Math.max(s.successes, l?.successes ?? 0) };
    } else {
      mastery[skill] = { ...l, successes: Math.max(s.successes, l.successes) };
    }
  }
  const byId = new Map<string, Misconception>();
  for (const m of local.misconceptions) byId.set(m.id, m);
  for (const m of server.misconceptions) byId.set(m.id, m); // server status wins
  const narrative =
    server.narrative.characters.length || server.narrative.runningScenario
      ? server.narrative
      : local.narrative;
  const interests = [...new Set([...local.interests, ...server.interests])];
  let lastSession = server.lastSession;
  if (local.lastSession && (!lastSession || local.lastSession.at > lastSession.at)) {
    lastSession = local.lastSession;
  }
  return { mastery, misconceptions: [...byId.values()], narrative, interests, lastSession };
}

// Compact summary for prompt injection: <=300 tokens (~1200 chars).
// Priority order: open misconceptions > narrative > skills > interests >
// last-session callback. Lower-priority sections are dropped first.
export const SUMMARY_CHAR_BUDGET = 1200;
export function buildLearnerSummary(m: LearnerModel): string {
  const parts: string[] = [];
  const open = m.misconceptions.filter((x) => x.status === "open");
  if (open.length) {
    parts.push(
      "Open misconceptions: " + open.map((x) => `${x.skill} (${x.note})`).join("; ")
    );
  }
  const n = m.narrative;
  if (n.characters.length || n.runningScenario || n.setting) {
    parts.push(
      `Story so far: ${n.characters.join(", ")}${n.setting ? ` in ${n.setting}` : ""}${n.runningScenario ? `. ${n.runningScenario}` : ""}`
    );
  }
  const entries = Object.entries(m.mastery);
  if (entries.length) {
    parts.push("Skills: " + entries.map(([s, v]) => `${s}(${v.level})`).join(", "));
  }
  if (m.interests.length) parts.push("Interests: " + m.interests.join(", "));
  if (m.lastSession?.callback) parts.push(`Last time: ${m.lastSession.callback}`);
  if (!parts.length) return "";
  // Highest priority first; drop from the end while over budget.
  const out: string[] = [];
  let used = "Returning learner. ".length;
  for (const p of parts) {
    const chunk = (out.length ? " " : "") + p + ".";
    if (used + chunk.length > SUMMARY_CHAR_BUDGET) break;
    out.push(chunk);
    used += chunk.length;
  }
  return "Returning learner. " + out.join("");
}

// Server-side mastery transitions (single source of truth for local + server).
// success: unseen->seen->practicing (2 consecutive) ->mastered (3+).
// failure: step back one level, reset streak, keep open for re-checks.
// misconceptionId: optionally mark a linked misconception resolved on success.
export function recordOutcome(
  m: LearnerModel,
  opts: { skill: string; success: boolean; misconceptionId?: string }
): LearnerModel {
  const now = new Date().toISOString();
  const cur = m.mastery[opts.skill] ?? { level: "unseen" as MasteryLevel, successes: 0, updatedAt: now };
  let level = cur.level;
  let successes = cur.successes;
  if (opts.success) {
    successes += 1;
    if (successes >= 3) level = "mastered";
    else if (successes >= 2) level = level === "mastered" ? "mastered" : "practicing";
    else level = level === "unseen" ? "seen" : level;
  } else {
    successes = 0;
    const i = MASTERY_ORDER.indexOf(level);
    level = MASTERY_ORDER[Math.max(0, i - 1)];
  }
  const misconceptions =
    opts.success && opts.misconceptionId
      ? m.misconceptions.map((x) =>
          x.id === opts.misconceptionId ? { ...x, status: "resolved" as const } : x
        )
      : m.misconceptions;
  return {
    ...m,
    mastery: { ...m.mastery, [opts.skill]: { level, successes, updatedAt: now } },
    misconceptions,
  };
}

// Narrative seed/extend: first session stores the lesson's storySeed so later// summaries (and generations) reuse the same cast instead of inventing one.
export function extendNarrative(
  m: LearnerModel,
  seed?: { characters?: string[]; setting?: string }
): LearnerModel {
  if (!seed || m.narrative.characters.length) return m;
  return {
    ...m,
    narrative: {
      characters: seed.characters ?? [],
      setting: seed.setting ?? "",
      runningScenario: m.narrative.runningScenario,
    },
  };
}

// Log a demonstrated misconception (idempotent per skill+note).
export function logMisconception(m: LearnerModel, skill: string, note: string): LearnerModel {
  const id = `${skill}:${note.slice(0, 32)}`;
  if (m.misconceptions.some((x) => x.id === id && x.status === "open")) return m;
  return {
    ...m,
    misconceptions: [
      ...m.misconceptions,
      { id, skill, note, status: "open" as const, createdAt: new Date().toISOString() },
    ],
  };
}

// Resolve via dialogue: correct follow-up for a skill resolves its open
// misconception and records a success.
export function resolveDialogue(m: LearnerModel, skill: string): LearnerModel {
  const open = m.misconceptions.find((x) => x.status === "open" && x.skill === skill);
  return recordOutcome(m, { skill, success: true, misconceptionId: open?.id });
}
