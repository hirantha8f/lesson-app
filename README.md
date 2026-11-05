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

## Deploy

**Web app (Vercel):** import the repo, set env vars, deploy — no build config needed.

| Var | Notes |
|---|---|
| `LLM_PROVIDER` | `baseten` or `openrouter` |
| `BASETEN_API_KEY` / `BASETEN_MODEL` | generation model |
| `BASETEN_DIALOGUE_MODEL` | small dialogue model (must be enabled for the key) |
| `SUPABASE_URL` / `SUPABASE_ANON_KEY` | server |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | browser |
| `NEXT_PUBLIC_MARIMO_URL` | optional: live marimo server to embed at `/marimo` |
| `TRUST_PROXY` | only behind a trusted proxy that strips forwarding headers |

Run `supabase/schema.sql` in the Supabase SQL editor once.

**Marimo:** two modes. (1) Static: `npm run marimo:export` regenerates the
self-contained WASM lab committed under `public/marimo/` (runs in the browser,
generated-content notebooks show samples). (2) Live: `npm run marimo:gallery`
serves the notebooks with your real generated lessons via the JSON bridge —
point `NEXT_PUBLIC_MARIMO_URL` at it.

## Flow

```
landing (roulette | github | upload) + profiler
  -> POST /api/lesson { rouletteId | githubUrl | code, profile, difficulty }
  -> Lesson JSON v2 -> LessonView (see/do/check/remix/teacher)
```
