import { saveGenerated, type GeneratedKind } from "@/lib/marimoStore";

export const runtime = "nodejs";

const KINDS: GeneratedKind[] = ["lesson", "guide", "parent"];

// Saves client-generated content (parent activities) for the marimo bridge.
// Lesson/guide routes save server-side directly; this route exists so the
// parent path, which generates locally from embedded data, can join in.
export async function POST(req: Request) {
  try {
    const { kind, data } = (await req.json()) as { kind?: string; data?: unknown };
    if (!kind || !KINDS.includes(kind as GeneratedKind) || data == null) {
      return Response.json({ error: "Provide kind (lesson|guide|parent) and data." }, { status: 400 });
    }
    const ok = await saveGenerated(kind as GeneratedKind, data);
    return Response.json({ ok });
  } catch (err: any) {
    return Response.json({ error: err?.message ?? "Unknown error" }, { status: 500 });
  }
}
