// Persona router: one engine, three doors. Persisted locally.

export type Persona = "student" | "teacher" | "parent";

export const PERSONAS: {
  id: Persona;
  title: string;
  promise: string;
}[] = [
  {
    id: "student",
    title: "Student",
    promise: "Drop code, get a lesson that teaches this file.",
  },
  {
    id: "teacher",
    title: "Teacher",
    promise: "Pick a syllabus topic, get a study guide + mark scheme.",
  },
  {
    id: "parent",
    title: "Parent",
    promise: "10-minute screen-optional games that teach thinking.",
  },
];

const KEY = "lfc-persona-v1";

export function loadPersona(): Persona | null {
  try {
    const v = localStorage.getItem(KEY);
    return v === "student" || v === "teacher" || v === "parent" ? v : null;
  } catch {
    return null;
  }
}

export function savePersona(p: Persona) {
  try {
    localStorage.setItem(KEY, p);
  } catch {
    /* ignore */
  }
}
