// Teacher study-guide generation: syllabus-aware, board-agnostic output.
// Boards appear as cross-reference badges (unified view), never as silos.

import type { LessonQuizQuestion } from "./prompt";
import { getTopic } from "./curriculum";

export const STUDY_GUIDE_SYSTEM_PROMPT = `You are a senior CS teacher writing a classroom study guide.

Given ONE syllabus topic + class level + lesson length, produce a guide a teacher can teach from tomorrow — accurate, board-neutral, with cross-refs to Edexcel/OCR/AQA where relevant.

Rules:
- Explain the topic in teacher language first, then give a pupil-facing version (2-3 sentences, plain words).
- 4-6 key ideas, each one teachable in ~5 minutes.
- One worked example with a short code snippet + trace a teacher can whiteboard.
- 3-5 known pupil misconceptions, each with the reality and a quick diagnostic question.
- Exam-style questions with marks and a real mark scheme (accept alternative valid answers).
- 4 retrieval quiz questions (4 options, one correct) for a starter next lesson.
- One classroom activity with timings that fits the lesson length (unplugged-first for under-14s).
- Never invent spec facts; keep board refs indicative.

Respond with ONLY valid JSON matching this exact shape, no fences, no preamble:

{
  "topic": string,
  "summary": string,
  "pupilVersion": string,
  "keyIdeas": [{ "title": string, "detail": string }],
  "workedExample": { "title": string, "code": string, "trace": string },
  "misconceptions": [{ "myth": string, "reality": string, "check": string }],
  "examQs": [{ "q": string, "marks": number, "markScheme": string }],
  "retrieval": [{ "question": string, "options": [string,string,string,string],
    "correctIndex": number, "explanation": string }],
  "classroomActivity": { "title": string, "minutes": number, "steps": string }
}`;

export function buildStudyGuidePrompt(topicId: string, level: string, minutes: number, learnerSummary?: string): string {
  const t = getTopic(topicId);
  const ctx = t
    ? `Topic: ${t.title}\nAbout: ${t.blurb}\nBoard refs: ${t.refs.map((r) => `${r.board} ${r.ref}`).join(", ")}`
    : `Topic: ${topicId}`;
  const history = learnerSummary
    ? `\nLearner history: ${learnerSummary}\nAddress the learner's open misconceptions in the misconceptions section; reuse story elements.\n`
    : "";
  return `${ctx}\nClass level: ${level}\nLesson length: ${minutes} minutes\n${history}\nProduce the study-guide JSON now. Keep it under ~5000 tokens.`;
}

export type StudyGuide = {
  topic: string;
  summary: string;
  pupilVersion?: string;
  keyIdeas: { title: string; detail: string }[];
  workedExample?: { title?: string; code?: string; trace?: string };
  misconceptions: { myth: string; reality: string; check?: string }[];
  examQs: { q: string; marks: number; markScheme: string }[];
  retrieval: LessonQuizQuestion[];
  classroomActivity?: { title?: string; minutes?: number; steps?: string };
};
