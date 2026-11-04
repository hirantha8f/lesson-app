// Learner profile with FLEXIBLE age (no fixed floor — decision 2).
// Persists to localStorage so returning learners skip the form.

export type CodingLevel = "new" | "some" | "confident";
export type Difficulty = "kids" | "cs1" | "pro";

export type LearnerProfile = {
  age: number; // free entry, prompt adapts
  eduLevel: string;
  industry: string;
  codingLevel: CodingLevel;
};

export const DEFAULT_PROFILE: LearnerProfile = {
  age: 16,
  eduLevel: "secondary",
  industry: "general",
  codingLevel: "some",
};

export const DIFFICULTY_META: Record<Difficulty, { label: string; hint: string }> = {
  kids: { label: "Explain like I'm 10", hint: "Young learner, no jargon" },
  cs1: { label: "CS1 / Beginner", hint: "First-year coding class" },
  pro: { label: "Pro", hint: "Working developer, idioms + tradeoffs" },
};

export function difficultyForProfile(p: LearnerProfile): Difficulty {
  if (p.age <= 12) return "kids";
  if (p.codingLevel === "confident") return "pro";
  return "cs1";
}

const KEY = "lfc-profile-v1";

export function loadProfile(): LearnerProfile | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw);
    // Migrate v1 ageBand -> numeric age.
    if (typeof saved.age !== "number") {
      const map: Record<string, number> = { "8-12": 10, "13-17": 15, "18-24": 20, "25+": 30 };
      saved.age = map[saved.ageBand] ?? DEFAULT_PROFILE.age;
      delete saved.ageBand;
    }
    return { ...DEFAULT_PROFILE, ...saved };
  } catch {
    return null;
  }
}

export function saveProfile(p: LearnerProfile) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* ignore */
  }
}

// ---- XP / streak (local only until Supabase classroom lands) ----
const XP_KEY = "lfc-xp-v1";
const STREAK_KEY = "lfc-streak-v1";

export function getXP(): number {
  try {
    return Number(localStorage.getItem(XP_KEY) ?? 0) || 0;
  } catch {
    return 0;
  }
}

export function addXP(n: number): number {
  try {
    const v = getXP() + n;
    localStorage.setItem(XP_KEY, String(v));
    const today = new Date().toISOString().slice(0, 10);
    const streakRaw = localStorage.getItem(STREAK_KEY);
    let s: { last: string; days: number } = streakRaw
      ? JSON.parse(streakRaw)
      : { last: "", days: 0 };
    if (s.last !== today) {
      const yesterday = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
      s = { last: today, days: s.last === yesterday ? s.days + 1 : 1 };
      localStorage.setItem(STREAK_KEY, JSON.stringify(s));
    }
    return v;
  } catch {
    return 0;
  }
}

export function getStreak(): number {
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    return raw ? JSON.parse(raw).days ?? 0 : 0;
  } catch {
    return 0;
  }
}
