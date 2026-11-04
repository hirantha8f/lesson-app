# Tasks

## 1. Learner-model store

- [x] 1.1 Add `learner_models` table + mastery columns to `supabase/schema.sql` and verify the SQL runs clean in the Supabase SQL editor
- [x] 1.2 Implement `lib/learnerModel.ts` (types, localStorage mirror `lfc-learner-v1`, server merge rule) and verify `tsc --noEmit` passes
- [x] 1.3 Implement `buildLearnerSummary()` (≤300 tokens, misconceptions > narrative > interests) with a unit-style check: feed a fixture model, assert token-ish length cap and priority order

## 2. Generation continuity

- [x] 2.1 Wire summary injection into `/api/lesson` and `/api/guide` and verify a returning-learner request contains a real-history callback in the output
- [x] 2.2 Add narrative seed/extend logic (first session creates elements, later sessions reuse) and verify the second generation reuses a stored character instead of inventing one
- [x] 2.3 Implement server-side `recordOutcome` mastery transitions and verify advance-after-two-successes / regress-on-failure via API-level checks

## 3. Journey view

- [x] 3.1 Build `JourneyMap` component (skill map, next-up recommendation, streak chapter) and verify it renders fixture state with correct levels
- [x] 3.2 Wire journey updates end-to-end (session outcome → map refresh without reload) and verify in dev against localStorage mode

## 4. Tutor dialogue

- [x] 4.1 Add cheap-model dialogue path (`BASETEN_DIALOGUE_MODEL`, Socratic prompt) to `lib/llm.ts` and verify a wrong answer returns a guiding question, not the answer
- [x] 4.2 Integrate follow-up turn into `QuizBlock` with static-hint fallback and verify fallback renders when the dialogue path is unreachable
- [x] 4.3 Record dialogue outcomes to the learner model and verify a correct follow-up resolves the linked misconception

## 5. Persona lenses + integration

- [x] 5.1 Expose the shared learner model to `TeacherPath`/`ParentPath` (standards view, co-play prompts) and verify all three lenses show the same skills and streak
- [x] 5.2 Full pass: anonymous session → local model → summary injection → journey → dialogue, verified in dev; `tsc` clean and `openspec validate` passes

## Workflow follow-up

- Archive the change after review requirements are satisfied.
- Verify the archived result.
