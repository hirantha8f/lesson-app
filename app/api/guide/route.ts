import {
  STUDY_GUIDE_SYSTEM_PROMPT,
  buildStudyGuidePrompt,
  type StudyGuide,
} from "@/lib/studyGuide";
import { getTopic } from "@/lib/curriculum";
import { chatCompletion, llmProvider, LLMError } from "@/lib/llm";
import { buildLearnerSummary, type LearnerModel } from "@/lib/learnerModel";
import { checkRateLimit, clientIp, GUIDE_LIMIT, AUTH_GUIDE_LIMIT } from "@/lib/rateLimit";
import { getServerUserId } from "@/lib/supabaseServer";
import { sanitizeGuide } from "@/lib/validate";
import { saveGenerated } from "@/lib/marimoStore";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { topicId, level, minutes, learner } = (await req.json()) as {
      topicId?: string;
      level?: string;
      minutes?: number;
      learner?: LearnerModel;
    };
    if (!topicId || !getTopic(topicId))
      return Response.json({ error: "Pick a valid syllabus topic." }, { status: 400 });
    const guideInput = sanitizeGuide(level, minutes);

    // Finding unauth-paid-llm-burn: bound spend before the billed call.
    // Signed-in callers (verified Supabase JWT) earn a roomier bucket.
    const uid = await getServerUserId(req);
    const bucket = uid
      ? { key: `guide:user:${uid}`, ...AUTH_GUIDE_LIMIT }
      : { key: `guide:${clientIp(req)}`, ...GUIDE_LIMIT };
    const rl = checkRateLimit(bucket.key, bucket.limit, bucket.windowMs);
    if (!rl.ok) {
      return Response.json(
        { error: `Rate limited — too many guides from this network. Retry in ~${rl.retryAfterSec}s.` },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
      );
    }

    let text: string;
    try {
      const summary = learner ? buildLearnerSummary(learner as LearnerModel) : "";
      text = await chatCompletion(
        [
          { role: "system", content: STUDY_GUIDE_SYSTEM_PROMPT },
          {
            role: "user",
            content: buildStudyGuidePrompt(topicId, guideInput.level, guideInput.minutes, summary || undefined),
          },
        ],
        7000
      );
    } catch (e: any) {
      const status = e instanceof LLMError ? e.status : 500;
      return Response.json({ error: e?.message ?? "Unknown error" }, { status });
    }

    let guide: StudyGuide;
    try {
      guide = JSON.parse(text.trim().replace(/^```json\s*|```$/g, ""));
    } catch {
      return Response.json({ error: "Model returned invalid JSON. Try again." }, { status: 502 });
    }
    // Marimo bridge: the generated guide appears in notebooks/11.
    await saveGenerated("guide", { topic: getTopic(topicId), guide });

    return Response.json({ guide, topic: getTopic(topicId), provider: llmProvider() });
  } catch (err: any) {
    return Response.json({ error: err?.message ?? "Unknown error" }, { status: 500 });
  }
}
