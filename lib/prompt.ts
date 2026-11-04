// Prompt v2: profile-aware, difficulty-laddered, multimodal-ready.
// One LLM call still — the model emits structured JSON that the client
// renders as text + diagram + tracer + playground + Parsons + quiz.

import type { Difficulty, LearnerProfile } from "./profile";

export const LESSON_SYSTEM_PROMPT = `You are a senior software engineer and CS teacher writing a code-reading lesson.

Given ONE source file + a learner profile (age, education, industry, coding level) + a difficulty level, teach the learner to READ and UNDERSTAND this exact file — not a generic tutorial.

Rules:
- Identify the language. No generic language primer.
- Pick 4-7 KEY CONCEPTS: the load-bearing parts of THIS file. Rank by importance. Skip boilerplate.
- Ground every explanation in real snippets from the file. Never invent behavior.
- Personalize ONE analogy to the learner's industry/age (e.g. nursing triage for healthcare, recipes for food industry, quests for a 10-year-old gamer). Keep it to 1-2 sentences per concept max — analogy serves the code, not replaces it.
- Age safety: for ages 8-17 use simple vocabulary, no jargon without a plain definition, encouraging tone, no scary/violent/mature examples.
- Difficulty:
  - kids: very short sentences, playful hook, one idea per paragraph.
  - cs1: beginner CS class tone, define each term once.
  - pro: terse, idioms, tradeoffs, edge cases, complexity notes.
- visuals: propose ONE simple flowchart (3-6 nodes) as nodes+edges a child could follow.
- trace: 4-8 execution steps with concrete variable values a learner can step through.
- playground: extract a SMALL runnable excerpt (<25 lines) + 2 micro-tasks (predict output, then modify one thing). Never output secrets or network calls.
- parsons: 4-7 scrambled lines whose correct order is the given order.
- quiz: 4-6 MCQs, 4 options each, one correct. Each needs: why-correct explanation, the common misconception it targets, a traceHint (which trace step disproves the wrong answers), and the CT skill it checks (one short phrase from the file's concepts).
- remix: one creative "break it / extend it" challenge with a checkable success criterion.
- teacher: 3 objectives (Bloom verbs), 3-5 vocab terms, 1 discussion prompt.
- continuity: if "Learner history" is provided below, reuse its story elements (characters/setting) in the hook and analogy, include one explicit callback to a previous session, and NEVER invent past events not in the history. If no history is provided, seed ONE memorable story element (a character or setting) and name it in the hook so future lessons can continue it.

Respond with ONLY valid JSON matching this exact shape, no fences, no preamble:

{
  "language": string,
  "fileSummary": string,
  "hook": string,
  "analogy": string,
  "concepts": [{ "title": string, "explanation": string, "codeRef": string }],
  "walkthrough": string,
  "visual": { "title": string, "caption": string,
    "nodes": [{ "id": string, "label": string }],
    "edges": [{ "from": string, "to": string, "label": string }] },
  "traceSteps": [{ "step": string, "lineRef": string, "vars": {}, "note": string }],
  "playground": { "language": string, "starterCode": string, "expectedOutput": string,
    "tasks": [{ "id": string, "title": string, "instruction": string }] },
  "parsons": { "instructions": string, "lines": [string] },
  "quiz": [{ "question": string, "options": [string,string,string,string],
    "correctIndex": number, "explanation": string, "misconception": string, "traceHint": string,
    "skill": string }],
  "remix": { "title": string, "brief": string, "successCriteria": string },
  "objectives": [string],
  "vocab": [{ "term": string, "def": string }],
  "discussion": string,
  "storySeed": { "characters": [string], "setting": string }
}`;

export function buildLessonUserPrompt(
  filename: string,
  code: string,
  profile: LearnerProfile,
  difficulty: Difficulty,
  learnerSummary?: string
): string {
  const history = learnerSummary
    ? `\nLearner history: ${learnerSummary}\n`
    : "";
  return `Filename: ${filename}
Difficulty: ${difficulty}
Learner: age ${profile.age}, education "${profile.eduLevel}", industry "${profile.industry}", coding level "${profile.codingLevel}"
${history}
File contents:
\`\`\`
${code}
\`\`\`

Produce the lesson JSON now. Keep explanations tight; whole JSON must stay under ~6000 tokens.`;
}

// ---------- types (all new fields optional so old cached lessons still render) ----------
export type LessonConcept = { title: string; explanation: string; codeRef: string };
export type LessonQuizQuestion = {
  question: string;
  options: [string, string, string, string];
  correctIndex: number;
  explanation: string;
  misconception?: string;
  traceHint?: string;
  skill?: string;
};
export type VisualSpec = {
  title?: string;
  caption?: string;
  nodes?: { id: string; label: string }[];
  edges?: { from: string; to: string; label?: string }[];
};
export type TraceStep = {
  step?: string;
  lineRef?: string;
  vars?: Record<string, string>;
  note?: string;
};
export type PlaygroundSpec = {
  language?: string;
  starterCode?: string;
  expectedOutput?: string;
  tasks?: { id: string; title: string; instruction: string }[];
};
export type Lesson = {
  language: string;
  fileSummary: string;
  hook?: string;
  analogy?: string;
  concepts: LessonConcept[];
  walkthrough: string;
  visual?: VisualSpec;
  traceSteps?: TraceStep[];
  playground?: PlaygroundSpec;
  parsons?: { instructions?: string; lines?: string[] };
  quiz: LessonQuizQuestion[];
  remix?: { title?: string; brief?: string; successCriteria?: string };
  objectives?: string[];
  vocab?: { term: string; def: string }[];
  discussion?: string;
  storySeed?: { characters?: string[]; setting?: string };
};
