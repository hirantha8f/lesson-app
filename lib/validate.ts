// Server-side input clamps for LLM-bound fields (audit run-2).
// Rate limits cap request COUNT; these cap per-request prompt size so a
// caller cannot inflate token spend via profile/guide/dialogue fields.

import { DEFAULT_PROFILE, type CodingLevel, type Difficulty, type LearnerProfile } from "./profile";

export function clampStr(v: unknown, max: number, fallback = ""): string {
  return typeof v === "string" ? v.slice(0, max) : fallback;
}

export function clampInt(v: unknown, min: number, max: number, fallback: number): number {
  const n = typeof v === "number" && Number.isFinite(v) ? Math.round(v) : fallback;
  return Math.min(max, Math.max(min, n));
}

const DIFFICULTIES: Difficulty[] = ["kids", "cs1", "pro"];
const LEVELS: CodingLevel[] = ["new", "some", "confident"];

export function sanitizeDifficulty(v: unknown): Difficulty {
  return DIFFICULTIES.includes(v as Difficulty) ? (v as Difficulty) : "cs1";
}

export function sanitizeProfile(p: Partial<LearnerProfile> | undefined): LearnerProfile {
  const src = p ?? {};
  return {
    age: clampInt(src.age, 3, 99, DEFAULT_PROFILE.age),
    eduLevel: clampStr(src.eduLevel, 60, DEFAULT_PROFILE.eduLevel),
    industry: clampStr(src.industry, 60, DEFAULT_PROFILE.industry),
    codingLevel: LEVELS.includes(src.codingLevel as CodingLevel)
      ? (src.codingLevel as CodingLevel)
      : DEFAULT_PROFILE.codingLevel,
  };
}

export function sanitizeGuide(level: unknown, minutes: unknown): { level: string; minutes: number } {
  return {
    level: clampStr(level, 60, "GCSE") || "GCSE",
    minutes: clampInt(minutes, 15, 180, 60),
  };
}
