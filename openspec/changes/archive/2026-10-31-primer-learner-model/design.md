# Design

## Context

See proposal.md (Why). Current state: lessons and guides are single-shot LLM calls (`lib/llm.ts` → `/api/lesson`, `/api/guide`) with only a session profile for personalization. Progress/XP lives in `localStorage` (`lib/profile.ts`); Supabase schema (`supabase/schema.sql`) has `progress` with a generic `detail` jsonb but no learner-model table and no app wiring. Baseten provider switch already exists. Requirements: see `specs/*/spec.md`.

## Goals / Non-Goals

**Goals:**
- Durable learner state that survives sessions and drives every generation call.
- Anonymous-first: full single-shot experience with zero login; model syncs on sign-in.
- Dialogue stays cheap: small-model path isolated from generation path.

**Non-Goals:**
- Auth UI and classroom invites (separate change; this change only adds the tables it needs).
- Real-time multiplayer or teacher live dashboards.
- Fine-tuning or per-learner model weights — prompt-level personalization only.

## Decisions

- **Store: Supabase `learner_models` + extended `progress`.** New `learner_models` table (one row per user: mastery jsonb, misconceptions jsonb, narrative jsonb, interests) rather than overloading `progress.detail`, because the model is read on every generation while progress rows are per-activity writes. Alternative (everything in `progress.detail`) rejected: read-amplification and no single source of truth.
- **Anonymous continuity via localStorage mirror.** Same shape as the server row, keyed `lfc-learner-v1`; merged into the server model on first sign-in (server wins on conflicts, client fills gaps). Keeps the Primer promise for logged-out kids and the hackathon demo.
- **Summary injection, not full history.** A `buildLearnerSummary()` helper compresses the model to ≤300 tokens (levels, open misconceptions, 1-line narrative, last-session callback) appended to the user prompt. Full history never enters context — cost control and the consumer-scale story.
- **Dialogue = second `chatCompletion` call with cheap-model env.** `BASETEN_DIALOGUE_MODEL` (+ optional `LLM_DIALOGUE_PROVIDER`) reuses `lib/llm.ts` plumbing; system prompt is Socratic-only (no content generation). Alternative (same strong model) rejected on cost; alternative (rule-based follow-ups) kept as the offline fallback when the cheap path fails.
- **Mastery updates computed server-side.** A `recordOutcome` helper in the API layer applies the transition rules (two-session success → advance; failure → regress) so local and Supabase states can't diverge in logic. Client only displays.
- **Personas as lenses, one model.** `TeacherPath`/`ParentPath` read the same learner model via new read helpers; no separate parent/teacher state. New `JourneyMap` component is the student lens.

## Risks / Trade-offs

- [Risk] Summary grows stale or contradictory → Mitigation: recomputed from source tables on every read, never cached; cap at 300 tokens with priority order (misconceptions > narrative > interests).
- [Risk] Cheap dialogue model leaks answers instead of guiding → Mitigation: Socratic system prompt with worked examples; fallback to existing static hints on any failure.
- [Risk] Supabase unavailable at demo time → Mitigation: localStorage mirror is fully functional standalone; sync is best-effort with visible "saved locally" state.
- [Risk] Fabricated callbacks (model invents past events) → Mitigation: callbacks are constructed from real history rows injected verbatim, and the prompt forbids inventing events (spec-tested).

## Migration Plan

1. Ship migration SQL alongside existing `supabase/schema.sql` (additive tables/columns only — no changes to current tables).
2. Deploy code with dual-write (localStorage always, Supabase when configured); reads prefer server when signed in.
3. Rollback: drop new tables; app degrades to current stateless behavior since summary injection is conditional on model presence.

## Open Questions

- Exact cheap-model slug for `BASETEN_DIALOGUE_MODEL` (depends on the user's Baseten deployment; default to a small Flash-class slug).
- Whether streak chapters need server-side date logic or client date is sufficient (leaning client, revisit if cheating matters).
