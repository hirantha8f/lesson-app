import { dialogueCompletion, LLMError } from "@/lib/llm";
import { checkRateLimit, clientIp } from "@/lib/rateLimit";
import { clampStr } from "@/lib/validate";

export const runtime = "nodejs";

// Socratic follow-up turn: cheap model, short output, no spend risk.
// The client falls back to static hints whenever this fails.
export async function POST(req: Request) {
  try {
    const { question, options, picked, correctIndex, misconception, traceHint, skill } =
      (await req.json()) as {
        question?: string;
        options?: string[];
        picked?: number;
        correctIndex?: number;
        misconception?: string;
        traceHint?: string;
        skill?: string;
      };
    if (!question || !Array.isArray(options) || typeof picked !== "number" || typeof correctIndex !== "number") {
      return Response.json({ error: "Provide question, options, picked, correctIndex." }, { status: 400 });
    }
    if (
      options.length < 2 || options.length > 6 ||
      picked < 0 || picked >= options.length ||
      correctIndex < 0 || correctIndex >= options.length
    ) {
      return Response.json({ error: "Options or answer index out of range." }, { status: 400 });
    }
    const safeQuestion = clampStr(question, 1000);
    const safeOptions = options.map((o) => clampStr(o, 300));
    const safeMisconception = clampStr(misconception, 300);
    const safeTraceHint = clampStr(traceHint, 300);
    const safeSkill = clampStr(skill, 80);

    const rl = checkRateLimit(`dialogue:${clientIp(req)}`, 30, 5 * 60_000);
    if (!rl.ok) {
      return Response.json({ error: "Tutor is busy — retry shortly." }, { status: 429 });
    }

    const letters = ["A", "B", "C", "D"];
    const userContent = [
      `Question: ${safeQuestion}`,
      ...safeOptions.map((o, i) => `${letters[i]}. ${o}`),
      `The learner picked ${letters[picked]} but the correct answer is ${letters[correctIndex]}.`,
      safeMisconception ? `Known trap: ${safeMisconception}` : "",
      safeTraceHint ? `Hint direction: ${safeTraceHint}` : "",
      safeSkill ? `Skill: ${safeSkill}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    try {
      const followup = await dialogueCompletion(userContent);
      return Response.json({ followup });
    } catch (e: any) {
      const status = e instanceof LLMError ? e.status : 500;
      return Response.json({ error: e?.message ?? "Tutor unavailable." }, { status });
    }
  } catch (err: any) {
    return Response.json({ error: err?.message ?? "Unknown error" }, { status: 500 });
  }
}
