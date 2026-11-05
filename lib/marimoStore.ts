// Bridge: generated lessons/guides/activities are saved as JSON where the
// marimo notebooks can read them, so generated content appears inside the
// marimo environment (notebooks/10-12). Local-first: on read-only hosts the
// save is best-effort and the notebooks fall back to a built-in sample.

import { promises as fs } from "fs";
import path from "path";

export type GeneratedKind = "lesson" | "guide" | "parent";

const DIR = path.join(process.cwd(), "notebooks", "generated");
const MAX_BYTES = 500_000;

export async function saveGenerated(kind: GeneratedKind, data: unknown): Promise<boolean> {
  try {
    const text = JSON.stringify({ kind, savedAt: new Date().toISOString(), data }, null, 2);
    if (text.length > MAX_BYTES) return false;
    await fs.mkdir(DIR, { recursive: true });
    await fs.writeFile(path.join(DIR, `${kind}.json`), text, "utf8");
    return true;
  } catch {
    return false;
  }
}
