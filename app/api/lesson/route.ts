import { LESSON_SYSTEM_PROMPT, buildLessonUserPrompt, type Lesson } from "@/lib/prompt";
import { getRouletteById } from "@/lib/roulette";
import { fetchGithubFile, parseGithubUrl } from "@/lib/github";
import { DEFAULT_PROFILE, type Difficulty, type LearnerProfile } from "@/lib/profile";
import { chatCompletion, llmProvider, LLMError } from "@/lib/llm";
import { buildLearnerSummary, type LearnerModel } from "@/lib/learnerModel";
import { checkRateLimit, clientIp, LESSON_LIMIT, AUTH_LESSON_LIMIT } from "@/lib/rateLimit";
import { getServerUserId } from "@/lib/supabaseServer";
import { clampStr, sanitizeDifficulty, sanitizeProfile } from "@/lib/validate";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_CHARS = 120_000;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      filename: inFilename,
      code: inCode,
      githubUrl,
      rouletteId,
      profile: inProfile,
      difficulty: inDifficulty,
      learner: inLearner,
    } = body as {
      filename?: string;
      code?: string;
      githubUrl?: string;
      rouletteId?: string;
      profile?: Partial<LearnerProfile>;
      difficulty?: Difficulty;
      learner?: LearnerModel;
    };

    const profile: LearnerProfile = sanitizeProfile(inProfile);
    const difficulty: Difficulty = sanitizeDifficulty(inDifficulty);

    // Resolve source: roulette > github > direct code.
    let filename = clampStr(inFilename, 120, "lesson") || "lesson";
    let code = typeof inCode === "string" ? inCode : "";

    if (rouletteId) {
      const item = getRouletteById(rouletteId);
      if (!item) return Response.json({ error: "Unknown roulette item." }, { status: 400 });
      filename = `${item.id}.${item.language === "python" ? "py" : "js"}`;
      code = item.code;
    } else if (githubUrl) {
      const parsed = parseGithubUrl(githubUrl);
      if (!parsed)
        return Response.json(
          { error: "Paste a github.com file URL like .../blob/main/src/index.ts" },
          { status: 400 }
        );
      try {
        const fetched = await fetchGithubFile(
          `https://raw.githubusercontent.com/${parsed.owner}/${parsed.repo}/${parsed.ref}/${parsed.path}`,
          MAX_CHARS
        );
        filename = fetched.filename;
        code = fetched.code;
      } catch (e: any) {
        return Response.json({ error: e.message ?? "GitHub fetch failed." }, { status: 400 });
      }
    }

    if (!code.trim()) return Response.json({ error: "Missing code." }, { status: 400 });
    if (code.length > MAX_CHARS)
      return Response.json(
        { error: `File too large (max ~${MAX_CHARS.toLocaleString()} characters).` },
        { status: 413 }
      );
    if (code.includes("\u0000"))
      return Response.json({ error: "File does not appear to be text." }, { status: 400 });

    // Finding unauth-paid-llm-burn: bound spend before the billed call.
    // Signed-in callers (verified Supabase JWT) earn a roomier bucket.
    const uid = await getServerUserId(req);
    const bucket = uid
      ? { key: `lesson:user:${uid}`, ...AUTH_LESSON_LIMIT }
      : { key: `lesson:${clientIp(req)}`, ...LESSON_LIMIT };
    const rl = checkRateLimit(bucket.key, bucket.limit, bucket.windowMs);
    if (!rl.ok) {
      return Response.json(
        { error: `Rate limited — too many lessons from this network. Retry in ~${rl.retryAfterSec}s.` },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
      );
    }

    let text: string;
    try {
      const summary = inLearner ? buildLearnerSummary(inLearner as LearnerModel) : "";
      text = await chatCompletion(
        [
          { role: "system", content: LESSON_SYSTEM_PROMPT },
          { role: "user", content: buildLessonUserPrompt(filename, code, profile, difficulty, summary || undefined) },
        ],
        8000
      );
    } catch (e: any) {
      const status = e instanceof LLMError ? e.status : 500;
      return Response.json({ error: e?.message ?? "Unknown error" }, { status });
    }

    let lesson: Lesson;
    try {
      lesson = JSON.parse(text.trim().replace(/^```json\s*|```$/g, ""));
    } catch {
      return Response.json({ error: "Model returned invalid JSON. Try again." }, { status: 502 });
    }

    return Response.json({
      lesson,
      filename,
      difficulty,
      provider: llmProvider(),
      code: code.slice(0, MAX_CHARS),
    });
  } catch (err: any) {
    return Response.json({ error: err?.message ?? "Unknown error" }, { status: 500 });
  }
}
