import { NextResponse } from "next/server";

// Liveness probe for deploys/load balancers. No secrets, no spend.
export async function GET() {
  return NextResponse.json({
    ok: true,
    provider: process.env.LLM_PROVIDER ?? "openrouter",
    supabase: Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ),
  });
}
