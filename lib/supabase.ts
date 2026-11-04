// Supabase browser client + classroom data layer.
// Anonymous-first: every function degrades gracefully when unconfigured
// or signed out; the app never requires auth to generate lessons.

import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import {
  emptyLearnerModel,
  mergeModels,
  type LearnerModel,
} from "./learnerModel";

let browser: SupabaseClient | null = null;

export function supabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export function getBrowserClient(): SupabaseClient | null {
  if (!supabaseConfigured()) return null;
  if (!browser) {
    browser = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return browser;
}

// ---------- auth ----------

export async function signUp(
  email: string,
  password: string,
  role: "teacher" | "student" | "parent",
  displayName: string
): Promise<{ user: User | null; needsConfirm: boolean; error?: string }> {
  const sb = getBrowserClient();
  if (!sb) return { user: null, needsConfirm: false, error: "Supabase not configured." };
  const { data, error } = await sb.auth.signUp({ email, password });
  if (error) return { user: null, needsConfirm: false, error: error.message };
  if (data.user) {
    const { error: pErr } = await sb.from("profiles").upsert({
      id: data.user.id,
      role,
      display_name: displayName,
    });
    if (pErr) return { user: data.user, needsConfirm: !data.session, error: pErr.message };
  }
  return { user: data.user, needsConfirm: !data.session };
}

export async function signIn(email: string, password: string): Promise<{ error?: string }> {
  const sb = getBrowserClient();
  if (!sb) return { error: "Supabase not configured." };
  const { error } = await sb.auth.signInWithPassword({ email, password });
  return error ? { error: error.message } : {};
}

export async function signOut() {
  await getBrowserClient()?.auth.signOut();
}

export async function currentUser(): Promise<User | null> {
  const { data } = (await getBrowserClient()?.auth.getUser()) ?? { data: { user: null } };
  return data.user;
}

// ---------- classrooms ----------

export type Classroom = { id: string; name: string; code: string; teacher_id: string };
export type Membership = { classroom_id: string; student_id: string };
export type Assignment = { id: string; classroom_id: string; kind: string; title: string; payload: any };
export type ProgressRow = { student_id: string; ref: string; xp: number; detail: any };

function makeCode(): string {
  const abc = "ABCDEFGHJKMNPQRSTUVWXYZ";
  const num = "23456789";
  const pick = (s: string, n: number) =>
    Array.from({ length: n }, () => s[Math.floor(Math.random() * s.length)]).join("");
  return `${pick(abc, 3)}-${pick(num, 4)}`;
}

export async function createClassroom(name: string): Promise<{ room?: Classroom; error?: string }> {
  const sb = getBrowserClient();
  if (!sb) return { error: "Supabase not configured." };
  const { data: u } = await sb.auth.getUser();
  if (!u.user) return { error: "Sign in first." };
  for (let i = 0; i < 4; i++) {
    const code = makeCode();
    const { data, error } = await sb
      .from("classrooms")
      .insert({ teacher_id: u.user.id, name, code })
      .select()
      .single();
    if (!error && data) return { room: data as Classroom };
    if (error && !/duplicate|unique/i.test(error.message)) return { error: error.message };
  }
  return { error: "Could not mint a unique code — try again." };
}

export async function joinClassroom(code: string): Promise<{ classroomId?: string; error?: string }> {
  const sb = getBrowserClient();
  if (!sb) return { error: "Supabase not configured." };
  const { data, error } = await sb.rpc("join_classroom", { p_code: code.trim().toUpperCase() });
  if (error) return { error: error.message };
  if (!data) return { error: "Unknown invite code." };
  return { classroomId: data as string };
}

export async function myTeachingRooms(): Promise<Classroom[]> {
  const sb = getBrowserClient();
  if (!sb) return [];
  const { data: u } = await sb.auth.getUser();
  if (!u.user) return [];
  const { data } = await sb.from("classrooms").select("*").eq("teacher_id", u.user.id).order("created_at");
  return (data ?? []) as Classroom[];
}

export async function myLearningRooms(): Promise<Classroom[]> {
  const sb = getBrowserClient();
  if (!sb) return [];
  const { data: u } = await sb.auth.getUser();
  if (!u.user) return [];
  const { data } = await sb
    .from("memberships")
    .select("classroom_id, classrooms(id, name, code)")
    .eq("student_id", u.user.id);
  return ((data ?? []).map((m: any) => m.classrooms).filter(Boolean)) as Classroom[];
}

export async function classMembers(classroomId: string): Promise<{ student_id: string; display_name: string }[]> {
  const sb = getBrowserClient();
  if (!sb) return [];
  const { data } = await sb
    .from("memberships")
    .select("student_id, profiles!inner(display_name)")
    .eq("classroom_id", classroomId);
  return ((data ?? []).map((m: any) => ({
    student_id: m.student_id,
    display_name: m.profiles?.display_name ?? m.student_id.slice(0, 8),
  })));
}

export async function classProgress(classroomId: string): Promise<ProgressRow[]> {
  const sb = getBrowserClient();
  if (!sb) return [];
  const { data } = await sb.from("progress").select("student_id, ref, xp, detail").eq("classroom_id", classroomId);
  return (data ?? []) as ProgressRow[];
}

export async function assignToClass(
  classroomId: string,
  kind: "lesson" | "guide" | "activity",
  title: string,
  payload: any
): Promise<{ error?: string }> {
  const sb = getBrowserClient();
  if (!sb) return { error: "Supabase not configured." };
  const { error } = await sb.from("assignments").insert({ classroom_id: classroomId, kind, title, payload });
  return error ? { error: error.message } : {};
}

export async function classAssignments(classroomId: string): Promise<Assignment[]> {
  const sb = getBrowserClient();
  if (!sb) return [];
  const { data } = await sb.from("assignments").select("*").eq("classroom_id", classroomId).order("created_at");
  return (data ?? []) as Assignment[];
}

// ---------- learner-model sync ----------

function rowToModel(row: any): LearnerModel {
  return {
    mastery: row.mastery ?? {},
    misconceptions: row.misconceptions ?? [],
    narrative: row.narrative ?? { characters: [], setting: "", runningScenario: "" },
    interests: row.interests ?? [],
    lastSession: row.last_session ?? null,
  };
}

export async function pullLearnerModel(userId: string): Promise<LearnerModel | null> {
  const sb = getBrowserClient();
  if (!sb) return null;
  const { data, error } = await sb.from("learner_models").select("*").eq("user_id", userId).single();
  if (error || !data) return null;
  return rowToModel(data);
}

export async function pushLearnerModel(userId: string, m: LearnerModel): Promise<void> {
  const sb = getBrowserClient();
  if (!sb) return;
  await sb.from("learner_models").upsert({
    user_id: userId,
    mastery: m.mastery,
    misconceptions: m.misconceptions,
    narrative: m.narrative,
    interests: m.interests,
    last_session: m.lastSession,
    updated_at: new Date().toISOString(),
  });
}

// Anonymous-first sync: merge local into server, server wins conflicts.
export async function syncLearnerModel(userId: string, local: LearnerModel): Promise<LearnerModel> {
  const server = await pullLearnerModel(userId);
  if (!server) {
    await pushLearnerModel(userId, local);
    return local;
  }
  const merged = mergeModels(server, local);
  await pushLearnerModel(userId, merged);
  return merged;
}

export async function recordClassProgress(
  classroomId: string,
  ref: string,
  xp: number,
  detail: any = {}
): Promise<void> {
  const sb = getBrowserClient();
  if (!sb) return;
  const { data: u } = await sb.auth.getUser();
  if (!u.user) return;
  await sb.from("progress").upsert(
    { student_id: u.user.id, classroom_id: classroomId, ref, xp, detail },
    { onConflict: "student_id,classroom_id,ref" }
  );
}

export function accessToken(): Promise<string | null> {
  return (async () => {
    const { data } = (await getBrowserClient()?.auth.getSession()) ?? { data: { session: null } };
    return data.session?.access_token ?? null;
  })();
}
