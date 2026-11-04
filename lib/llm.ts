// Provider abstraction: OpenRouter (multi-provider routing) or Baseten
// (dedicated inference). Switch with LLM_PROVIDER. Both speak the
// OpenAI chat-completions shape, so callers stay identical.
//
// Env:
//   LLM_PROVIDER=openrouter|baseten   (default openrouter)
//   OPENROUTER_API_KEY / OPENROUTER_MODEL / SITE_URL
//   BASETEN_API_KEY (required for baseten)
//   BASETEN_MODEL   (e.g. "baseten/deepseek-ai/DeepSeek-V4.1-Flash" or your dedicated slug)
//   BASETEN_URL     (override for dedicated deployments; default Model APIs endpoint)

export type ChatMessage = { role: "system" | "user"; content: string };

export class LLMError extends Error {
  status: number;
  hint: string;
  constructor(message: string, status: number, hint = "") {
    super(message);
    this.status = status;
    this.hint = hint;
  }
}

export function llmProvider(): string {
  return process.env.LLM_PROVIDER ?? "openrouter";
}

// Cheap-model Socratic path (tutor-dialogue capability): short guiding
// turns served ONLY by a dialogue-specific small model, never the primary
// generation model (spec). When no dialogue model is configured the call
// fails and the client falls back to static hints.
export const TUTOR_SYSTEM_PROMPT = `You are a patient tutor helping a learner who just answered a quiz question incorrectly.
Ask EXACTLY ONE short guiding question that leads them toward the correct answer.
Rules: never state or hint at the correct option letter; never give the answer; keep it to 1-2 sentences; end with the question.`;

export function dialogueModel(): string | null {
  const provider = process.env.LLM_DIALOGUE_PROVIDER ?? llmProvider();
  if (provider === "baseten") {
    return process.env.BASETEN_DIALOGUE_MODEL ?? null;
  }
  return process.env.OPENROUTER_DIALOGUE_MODEL ?? null;
}

export async function dialogueCompletion(userContent: string): Promise<string> {
  const provider = process.env.LLM_DIALOGUE_PROVIDER ?? llmProvider();
  const url =
    provider === "baseten"
      ? (process.env.BASETEN_URL ?? "https://inference.baseten.co/v1/chat/completions")
      : "https://openrouter.ai/api/v1/chat/completions";
  const key =
    provider === "baseten" ? process.env.BASETEN_API_KEY : process.env.OPENROUTER_API_KEY;
  if (!key) throw new LLMError("Server missing dialogue API key.", 500);
  const model = dialogueModel();
  if (!model) {
    throw new LLMError(
      "Dialogue model not configured (set BASETEN_DIALOGUE_MODEL or OPENROUTER_DIALOGUE_MODEL).",
      500
    );
  }
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${key}`,
  };
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers,
      signal: AbortSignal.timeout(30_000),
      body: JSON.stringify({
        model,
        // Reasoning models need headroom: thinking + final answer must fit.
        max_tokens: 4000,
        messages: [
          { role: "system", content: TUTOR_SYSTEM_PROMPT },
          { role: "user", content: userContent },
        ],
      }),
    });
  } catch (e: any) {
    const timedOut = e?.name === "TimeoutError" || e?.name === "AbortError";
    throw new LLMError(timedOut ? "Tutor took too long." : `Could not reach ${provider}.`, 504);
  }
  if (!res.ok) throw new LLMError(`Tutor error (${res.status}).`, 502);
  const data = await res.json();
  const msg: any = data.choices?.[0]?.message;
  const content = msg?.content;
  const text =
    typeof content === "string"
      ? content
      : Array.isArray(content)
        ? content.map((c: any) => (typeof c === "string" ? c : (c?.text ?? ""))).join("")
        : content != null
          ? JSON.stringify(content)
          : "";
  if (!text.trim()) {
    const fr = (data.choices?.[0] as any)?.finish_reason;
    console.error("[dialogue] empty content, finish_reason:", fr, "raw:", JSON.stringify(data).slice(0, 800));
    throw new LLMError("Empty tutor reply.", 502);
  }
  // Kid-facing polish: collapse repeated punctuation artifacts.
  return text.trim().replace(/([?!]){2,}/g, "$1");
}

export async function chatCompletion(
  messages: ChatMessage[],
  maxTokens: number
): Promise<string> {
  const provider = llmProvider();
  const url =
    provider === "baseten"
      ? (process.env.BASETEN_URL ?? "https://inference.baseten.co/v1/chat/completions")
      : "https://openrouter.ai/api/v1/chat/completions";

  const key =
    provider === "baseten" ? process.env.BASETEN_API_KEY : process.env.OPENROUTER_API_KEY;
  if (!key)
    throw new LLMError(
      provider === "baseten"
        ? "Server missing BASETEN_API_KEY."
        : "Server missing OPENROUTER_API_KEY.",
      500
    );

  const model =
    provider === "baseten"
      ? (process.env.BASETEN_MODEL ?? "baseten/deepseek-ai/DeepSeek-V4.1-Flash")
      : (process.env.OPENROUTER_MODEL ?? "anthropic/claude-sonnet-4.6");

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${key}`,
  };
  if (provider === "openrouter") {
    headers["HTTP-Referer"] = process.env.SITE_URL ?? "https://localhost:3000";
    headers["X-Title"] = "Learn From Code";
  }

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers,
      signal: AbortSignal.timeout(50_000),
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        response_format: { type: "json_object" },
        messages,
      }),
    });
  } catch (e: any) {
    const timedOut = e?.name === "TimeoutError" || e?.name === "AbortError";
    throw new LLMError(
      timedOut
        ? "The AI took too long (>50s). Try a smaller file, or generate again."
        : `Could not reach ${provider}: ${e?.message ?? "network error"}`,
      504
    );
  }

  if (!res.ok) {
    const body = await res.text();
    console.error(`[llm:${provider}]`, res.status, body.slice(0, 1000));
    let hint = "";
    if (res.status === 401) hint = " Bad API key — check env vars.";
    else if (res.status === 429) hint = " Rate limited — wait and retry.";
    else if (/no endpoints|not found|invalid model|does not exist/i.test(body))
      hint = ` Check model id ("${model}").`;
    throw new LLMError(`AI provider error (${res.status}).${hint}`, 502);
  }

  const data = await res.json();
  const raw: unknown = data.choices?.[0]?.message?.content;
  const text = typeof raw === "string" ? raw : raw != null ? JSON.stringify(raw) : "";
  if (!text) throw new LLMError("No response from model.", 502);
  return text;
}
