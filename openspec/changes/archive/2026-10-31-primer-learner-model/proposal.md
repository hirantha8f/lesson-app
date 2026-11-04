# Proposal: Primer Learner Model

## Why

Every lesson the app generates today is stateless: it knows the learner's age and industry for one request, then forgets everything. YC's Primer RFS (Fall 2026) describes the winning shape of AI tutoring — a companion that "reshapes itself around who the learner is becoming," with private-tutor quality at consumer scale. Without memory, continuity, and mastery tracking, we are a lesson generator, not a tutor. Supabase (classrooms + progress) and Baseten (cheap dedicated inference) give us the store and the scale to close that gap now.

## What Changes

- Introduce a **persistent learner model**: per-learner skill mastery (from the CT skills in `lib/curriculum.ts`), a misconception log, interests/life context, and session history. Stored in Supabase `progress` (+ a new `learner_models` table); anonymous learners keep a local-only subset.
- Inject a **learner-model summary** into every lesson and study-guide generation call, producing continuity ("last time the robot crashed — remember why?").
- Add a **journey view**: visible skill map (seen → practicing → mastered), next-up recommendations, and spaced re-checks of old misconceptions inside new lessons.
- Add a **Socratic follow-up turn** after wrong quiz answers, served by a small cheap Baseten model; the strong model keeps doing generation.
- Add **narrative continuity**: recurring characters/scenarios per learner, hooks that callback to prior episodes; prompt fields (`hook`, `analogy`) become episode N instead of episode 1.
- Unify the three persona paths as **lenses on one learner** (student journey, parent prompts, teacher standards) instead of three separate apps.
- No removals. Anonymous single-shot generation keeps working with zero login.

## Capabilities

### New Capabilities

- `learner-model`: durable per-learner state — skill mastery levels, misconception log, interests, history — and its summarization for prompt injection.
- `learning-journey`: mastery map UI, next-up recommendations, spaced-retrieval scheduling of past misconceptions, streak-as-story rituals.
- `tutor-dialogue`: Socratic follow-up turns after incorrect answers, misconception-targeted re-questioning, cheap-model serving path.
- `narrative-continuity`: persistent story elements per learner, callback hooks, episode framing in generated content.

### Modified Capabilities

- None (no existing specs; generation behavior changes are captured by the new capabilities above).

## Impact

- `lib/` gains `learnerModel.ts` (+ Supabase client additions); `lib/llm.ts` gains a dialogue (small-model) path; both API routes accept and forward learner-model summaries.
- New `supabase/schema.sql` migration (`learner_models`, skill/mastery columns on `progress`).
- New components: `JourneyMap`, `TutorTurn`, narrative fields in `LessonView`/activity cards.
- Dependencies: Supabase project credentials (classroom work already needs them); Baseten small-model slug for dialogue.
- Cost: one extra cheap-model call only on wrong answers; summaries are a few hundred tokens per generation.
