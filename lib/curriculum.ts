// Unified syllabus map (decision: boards NOT siloed).
// One topic list; each topic carries board refs as badges.
// Refs are indicative — always verify against the live spec before exams.

export type Topic = {
  id: string;
  title: string;
  blurb: string;
  refs: { board: string; ref: string }[];
  ct: string[]; // computational-thinking skills exercised
};

export const TOPICS: Topic[] = [
  {
    id: "decomposition",
    title: "Decomposition & abstraction",
    blurb: "Breaking big problems down and hiding detail that doesn't matter.",
    refs: [
      { board: "Edexcel", ref: "T1" },
      { board: "OCR", ref: "2.1" },
      { board: "AQA", ref: "3.1" },
      { board: "CSTA", ref: "3A-AP-13" },
      { board: "KS", ref: "KS3" },
    ],
    ct: ["break big jobs down", "make up rules"],
  },
  {
    id: "algorithms",
    title: "Algorithms & flowcharts",
    blurb: "Following, amending and writing algorithms; pseudocode and flowcharts.",
    refs: [
      { board: "Edexcel", ref: "T1" },
      { board: "OCR", ref: "2.1" },
      { board: "AQA", ref: "3.1" },
      { board: "CSTA", ref: "2-AP-10" },
      { board: "KS", ref: "KS2–3" },
    ],
    ct: ["step-by-step recipes", "spot the pattern"],
  },
  {
    id: "sorting-searching",
    title: "Sorting & searching",
    blurb: "Bubble/merge/insertion sort, binary vs linear search, efficiency intuition.",
    refs: [
      { board: "Edexcel", ref: "T1" },
      { board: "OCR", ref: "2.1" },
      { board: "AQA", ref: "3.1" },
      { board: "CSTA", ref: "3A-AP-16" },
      { board: "KS", ref: "KS3" },
    ],
    ct: ["spot the pattern", "compare methods"],
  },
  {
    id: "data-rep",
    title: "Binary & data representation",
    blurb: "Binary/denary/hex, characters, images, sound, compression.",
    refs: [
      { board: "Edexcel", ref: "T2" },
      { board: "OCR", ref: "1.2" },
      { board: "AQA", ref: "3.4" },
      { board: "CSTA", ref: "2-DA-07" },
      { board: "KS", ref: "KS3" },
    ],
    ct: ["secret codes", "represent ideas"],
  },
  {
    id: "hardware",
    title: "Hardware & the CPU",
    blurb: "CPU parts, fetch–execute cycle, memory, storage, embedded systems.",
    refs: [
      { board: "Edexcel", ref: "T3" },
      { board: "OCR", ref: "1.1–1.2" },
      { board: "AQA", ref: "3.5" },
      { board: "KS", ref: "KS3" },
    ],
    ct: ["how machines follow orders"],
  },
  {
    id: "networks",
    title: "Networks & the internet",
    blurb: "Packets, protocols, topologies, network security basics.",
    refs: [
      { board: "Edexcel", ref: "T4" },
      { board: "OCR", ref: "1.3–1.4" },
      { board: "AQA", ref: "3.6" },
      { board: "CSTA", ref: "2-NI-04" },
      { board: "KS", ref: "KS3" },
    ],
    ct: ["send messages reliably"],
  },
  {
    id: "programming",
    title: "Programming fundamentals",
    blurb: "Sequence, selection, iteration, data types, subprograms.",
    refs: [
      { board: "Edexcel", ref: "T6" },
      { board: "OCR", ref: "2.2" },
      { board: "AQA", ref: "3.2" },
      { board: "CSTA", ref: "3A-AP-17" },
      { board: "KS", ref: "KS2–3" },
    ],
    ct: ["step-by-step recipes", "make decisions", "repeat smartly"],
  },
  {
    id: "robust",
    title: "Robust programs & testing",
    blurb: "Defensive design, validation, test plans, trace tables, debugging.",
    refs: [
      { board: "Edexcel", ref: "T6" },
      { board: "OCR", ref: "2.3" },
      { board: "AQA", ref: "3.2" },
      { board: "CSTA", ref: "3A-AP-20" },
      { board: "KS", ref: "KS3" },
    ],
    ct: ["find the bug", "prove it works"],
  },
  {
    id: "logic",
    title: "Boolean logic",
    blurb: "AND/OR/NOT, truth tables, logic in selection and search.",
    refs: [
      { board: "Edexcel", ref: "T1" },
      { board: "OCR", ref: "2.4" },
      { board: "AQA", ref: "3.2" },
      { board: "KS", ref: "KS4" },
    ],
    ct: ["true-or-false rules"],
  },
  {
    id: "impacts",
    title: "Impacts, ethics & law",
    blurb: "Privacy, bias, environment, legislation; thinking about consequences.",
    refs: [
      { board: "Edexcel", ref: "T5" },
      { board: "OCR", ref: "1.6" },
      { board: "AQA", ref: "3.8" },
      { board: "CSTA", ref: "3A-IC-27" },
      { board: "KS", ref: "KS2–4" },
    ],
    ct: ["ask who is affected"],
  },
];

export function getTopic(id: string): Topic | undefined {
  return TOPICS.find((t) => t.id === id);
}
