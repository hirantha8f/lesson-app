import { createClient } from "@supabase/supabase-js";

// Server-side caller check (audit follow-up: full caller auth once wired).
// Returns the user id when a valid Supabase JWT is presented, else null.
// Anonymous callers keep working under the tighter anonymous buckets.
export async function getServerUserId(req: Request): Promise<string | null> {
  try {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_ANON_KEY;
    const auth = req.headers.get("authorization");
    if (!url || !key || !auth?.startsWith("Bearer ")) return null;
    const token = auth.slice("Bearer ".length).trim();
    if (!token) return null;
    const sb = createClient(url, key);
    const { data, error } = await sb.auth.getUser(token);
    if (error || !data.user) return null;
    return data.user.id;
  } catch {
    return null;
  }
}
