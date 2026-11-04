import type { Lesson } from "./prompt";

// Lesson JSON -> markdown (student handout). Teacher worksheet appended
// when includeTeacher is true — same source, printable via CSS.
export function lessonToMarkdown(
  filename: string,
  lesson: Lesson,
  opts: { includeTeacher?: boolean } = {}
): string {
  const concepts = lesson.concepts
    .map((c) => `### ${c.title}\n\n${c.explanation}\n\n\`\`\`\n${c.codeRef}\n\`\`\``)
    .join("\n\n");

  const trace = (lesson.traceSteps ?? [])
    .map(
      (t, i) =>
        `${i + 1}. **${t.step ?? "step"}** \`${t.lineRef ?? ""}\` — ${t.note ?? ""}` +
        (t.vars && Object.keys(t.vars).length
          ? `\n   vars: ${Object.entries(t.vars)
              .map(([k, v]) => `${k}=${v}`)
              .join(", ")}`
          : "")
    )
    .join("\n");

  const quiz = lesson.quiz
    .map((q, i) => {
      const o = q.options
        .map((x, j) => `${String.fromCharCode(65 + j)}. ${x}${j === q.correctIndex ? " (correct)" : ""}`)
        .join("\n");
      return `**Q${i + 1}. ${q.question}**\n\n${o}\n\n_${q.explanation}_`;
    })
    .join("\n\n---\n\n");

  let md = `# Lesson: ${filename}\n\n**Language:** ${lesson.language}\n\n`;
  if (lesson.hook) md += `> ${lesson.hook}\n\n`;
  md += `## Overview\n\n${lesson.fileSummary}\n\n`;
  if (lesson.analogy) md += `**Analogy:** ${lesson.analogy}\n\n`;
  md += `## Key Concepts\n\n${concepts}\n\n## Walkthrough\n\n${lesson.walkthrough}\n\n`;
  if (trace) md += `## Trace-through\n\n${trace}\n\n`;
  if (lesson.playground?.starterCode)
    md += `## Try it\n\n\`\`\`${lesson.playground.language ?? ""}\n${lesson.playground.starterCode}\n\`\`\`\n\nExpected: \`${lesson.playground.expectedOutput ?? ""}\`\n\n`;
  md += `## Quiz\n\n${quiz}\n`;
  if (lesson.remix?.title)
    md += `\n## Remix challenge: ${lesson.remix.title}\n\n${lesson.remix.brief}\n\nDone when: ${lesson.remix.successCriteria}\n`;

  if (opts.includeTeacher) {
    md += `\n\n---\n\n# Teacher worksheet: ${filename}\n\n## Objectives\n\n${(lesson.objectives ?? []).map((o) => `- ${o}`).join("\n")}\n\n## Vocab\n\n${(lesson.vocab ?? []).map((v) => `- **${v.term}**: ${v.def}`).join("\n")}\n\n## Discussion\n\n${lesson.discussion ?? ""}\n`;
  }
  return md;
}
