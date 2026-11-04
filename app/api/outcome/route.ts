import {
  emptyLearnerModel,
  logMisconception,
  recordOutcome,
  type LearnerModel,
} from "@/lib/learnerModel";

export const runtime = "nodejs";

// Thin wrapper over server-side recordOutcome: the client posts its local
// model + an assessed outcome, the server applies the single source of truth
// for mastery transitions and returns the updated model. No LLM, no spend.
export async function POST(req: Request) {
  try {
    const { learner, skill, success, misconceptionId, logNote } = (await req.json()) as {
      learner?: LearnerModel;
      skill?: string;
      success?: boolean;
      misconceptionId?: string;
      logNote?: string;
    };
    if (!skill || typeof success !== "boolean") {
      return Response.json({ error: "Provide skill and success." }, { status: 400 });
    }
    const base: LearnerModel = learner ?? emptyLearnerModel();
    // Log demonstrated misconceptions before applying the transition so a
    // wrong answer both regresses mastery and schedules a re-check.
    const withLog =
      !success && logNote ? logMisconception(base, skill, logNote) : base;
    const model = recordOutcome(withLog, { skill, success, misconceptionId });
    return Response.json({ model });
  } catch (err: any) {
    return Response.json({ error: err?.message ?? "Unknown error" }, { status: 500 });
  }
}
