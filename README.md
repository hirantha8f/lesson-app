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
