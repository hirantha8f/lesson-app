// Regenerates the static marimo lab: one self-contained HTML file per
// notebook under public/marimo/ (assets load from CDN at view time).
// Run: npm run marimo:export   (requires Python + marimo installed)

import { spawnSync } from "node:child_process";
import { mkdirSync, rmSync } from "node:fs";
import path from "node:path";

const NOTEBOOKS = [
  ["notebooks/00_primer_home.py", "primer-home.html"],
  ["notebooks/01_student_lab.py", "student-lab.html"],
  ["notebooks/02_teacher_studio.py", "teacher-studio.html"],
  ["notebooks/03_parent_playground.py", "parent-playground.html"],
  ["notebooks/10_generated_lesson.py", "generated-lesson.html"],
  ["notebooks/11_generated_guide.py", "generated-guide.html"],
  ["notebooks/12_generated_parent.py", "generated-parent.html"],
];

const outDir = path.join(process.cwd(), "public", "marimo");
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

for (const [src, dest] of NOTEBOOKS) {
  const out = path.join(outDir, dest);
  const res = spawnSync(
    "python",
    ["-m", "marimo", "export", "html-wasm", src, "-o", out, "--mode", "run", "--single-file"],
    { stdio: "inherit" }
  );
  if (res.status !== 0) {
    console.error(`Export failed: ${src}`);
    process.exit(1);
  }
  console.log(`exported ${dest}`);
}
console.log("marimo static lab ready: public/marimo/");
