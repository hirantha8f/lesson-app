# Learn From Code — v2 (hackathon)

Spin the wheel, paste a GitHub file, or drop your own. Get a tailored lesson
with hook + analogy, diagram, step-through animation, playground, Parsons
puzzle, quiz with misconception teaching, remix challenge, and teacher worksheet.

## Stack

Next.js (App Router) + OpenRouter API (plain `fetch`). No DB/auth — XP + streak
+ profile persist in `localStorage`. `.md` + worksheet export client-side.

## Run

```bash
npm install
cp .env.example .env.local   # add OPENROUTER_API_KEY
npm run dev
```

## Marimo interactive lab

Reactive Python companion apps for every user (Primer home, student lab,
teacher studio, parent playground) live in `notebooks/`.

```bash
python -m pip install -r notebooks/requirements.txt
npm run marimo:gallery   # serves the gallery; set NEXT_PUBLIC_MARIMO_URL to embed it at /marimo
npm run marimo:check     # validate the notebooks
```

Static alternative: `marimo export html-wasm notebooks/01_student_lab.py -o out/student --mode run`.

## Flow

```
landing (roulette | github | upload) + profiler
  -> POST /api/lesson { rouletteId | githubUrl | code, profile, difficulty }
  -> Lesson JSON v2 -> LessonView (see/do/check/remix/teacher)
```

## Files

```
app/page.tsx              - persona router + student tabs + profiler + XP + difficulty re-gen
app/marimo/page.tsx       - marimo lab: embeds NEXT_PUBLIC_MARIMO_URL gallery or local run instructions
notebooks/                - marimo apps (Primer home, student lab, teacher studio, parent playground) + requirements.txt
app/api/lesson/route.ts   - roulette/github/upload resolve -> one LLM call
app/api/guide/route.ts    - syllabus topic -> study-guide LLM call (teacher path)
lib/prompt.ts             - student v2 system prompt + Lesson types
lib/studyGuide.ts         - teacher system prompt + StudyGuide types
lib/persona.ts            - student | teacher | parent router + persistence
lib/profile.ts            - flexible-age profile, difficulty ladder, XP/streak
lib/curriculum.ts         - UNIFIED topic map, board refs as badges (Edexcel/OCR/AQA/CSTA/KS)
lib/activities.ts         - embedded parent unplugged activities + robot challenges
lib/roulette.ts           - 10 curated demo-safe picks
lib/llm.ts                 - provider switch (OpenRouter/Baseten) + cheap dialogue path
lib/rateLimit.ts            - anonymous + authed buckets (audit: quota burn)
lib/learnerModel.ts         - Primer memory: mastery, misconceptions, narrative, summary, transitions
lib/supabase.ts             - browser client: auth, classrooms, assignments, progress, model sync
lib/supabaseServer.ts       - verify Supabase JWT on routes (authed buckets)
lib/github.ts             - github.com/blob URL -> raw fetch
lib/markdown.ts           - student .md + teacher worksheet export
supabase/schema.sql       - classroom schema: profiles, classrooms, memberships, assignments, progress + RLS
components/PersonaPicker.tsx  - three-door landing
components/TeacherPath.tsx    - topic grid + study guide (misconceptions, exam Qs, mark schemes)
components/ParentPath.tsx     - age/time/device + activity roulette + activity cards
components/RobotRunner.tsx    - IN-APP grid-robot runner (sequence/debug, animated, buggy presets)
components/Roulette.tsx       - slot animation + category filter
components/ProfilerForm.tsx   - flexible age/edu/industry/level
```

## The 5 suggestions, where they live

1. 90-sec wow: default tab is Roulette, `whyFun` hook line, tracer first.
2. Difficulty ladder: `kids | cs1 | pro` toggle re-calls API with same source.
3. Wrong-answer teaching: `misconception + traceHint` per quiz question.
4. Teacher mode: objectives/vocab/discussion/key, print CSS, worksheet `.md`.
5. Safety: age-aware prompt, playground runs only `starterCode` excerpt
   (JS `Function` + console capture, others predict-vs-expected), server-side
   size + binary guards on all inputs.
