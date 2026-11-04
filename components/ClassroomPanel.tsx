"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { TOPICS } from "@/lib/curriculum";
import {
  assignToClass,
  classAssignments,
  classMembers,
  classProgress,
  createClassroom,
  joinClassroom,
  myLearningRooms,
  myTeachingRooms,
  recordClassProgress,
  supabaseConfigured,
  type Assignment,
  type Classroom,
} from "@/lib/supabase";

// Teacher lens: create classes, share codes, see members/progress, assign topics.
// Student lens: join by code, see assignments. Progress records on quiz success.
export function recordQuizProgress(ref: string, xp: number) {
  if (!supabaseConfigured() || typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem("lfc-classes-v1");
    const ids: string[] = raw ? JSON.parse(raw) : [];
    import("@/lib/supabase").then((s) => {
      ids.forEach((id) => s.recordClassProgress(id, ref, xp, { at: new Date().toISOString() }));
    });
  } catch {
    /* ignore */
  }
}

function rememberClass(id: string) {
  try {
    const raw = localStorage.getItem("lfc-classes-v1");
    const ids: string[] = raw ? JSON.parse(raw) : [];
    if (!ids.includes(id)) localStorage.setItem("lfc-classes-v1", JSON.stringify([...ids, id]));
  } catch {
    /* ignore */
  }
}

export function TeacherClassrooms({ user }: { user: User | null }) {
  const [rooms, setRooms] = useState<Classroom[]>([]);
  const [name, setName] = useState("");
  const [msg, setMsg] = useState("");
  const [sel, setSel] = useState<Classroom | null>(null);
  const [members, setMembers] = useState<{ student_id: string; display_name: string }[]>([]);
  const [progress, setProgress] = useState<{ student_id: string; ref: string; xp: number }[]>([]);
  const [assignTopic, setAssignTopic] = useState(TOPICS[0].id);

  const reload = async () => setRooms(await myTeachingRooms());
  useEffect(() => { if (user) reload(); }, [user]);
  if (!supabaseConfigured() || !user) return null;

  const create = async () => {
    if (!name.trim()) return;
    const r = await createClassroom(name.trim());
    if (r.error) setMsg(r.error);
    else {
      setMsg(`Created! Invite code: ${r.room!.code}`);
      setName("");
      reload();
    }
  };

  const open = async (room: Classroom) => {
    setSel(room);
    setMembers(await classMembers(room.id));
    setProgress(await classProgress(room.id));
  };

  const assign = async () => {
    if (!sel) return;
    const t = TOPICS.find((x) => x.id === assignTopic)!;
    const r = await assignToClass(sel.id, "guide", t.title, { topicId: t.id });
    setMsg(r.error ?? `Assigned "${t.title}" to ${sel.name}.`);
  };

  return (
    <div className="panel">
      <h3 style={{ marginTop: 0 }}>My classrooms</h3>
      <div className="btnrow" style={{ marginTop: 0 }}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Class name, e.g. Year 10 CS" style={{ flex: 1 }} />
        <button className="primary" onClick={create} type="button">Create class</button>
      </div>
      {msg && <p className="muted">{msg}</p>}
      <ul>
        {rooms.map((r) => (
          <li key={r.id}>
            <button className="linkbtn" onClick={() => open(r)} type="button">{r.name}</button>{" "}
            <code>{r.code}</code>
          </li>
        ))}
      </ul>
      {sel && (
        <div className="concept">
          <h3 style={{ marginTop: 0 }}>{sel.name} <span className="muted">({members.length} students)</span></h3>
          <ul>
            {members.map((m) => {
              const xp = progress.filter((p) => p.student_id === m.student_id).reduce((a, p) => a + p.xp, 0);
              return <li key={m.student_id}>{m.display_name} — {xp} XP classroom total</li>;
            })}
          </ul>
          <div className="btnrow">
            <select value={assignTopic} onChange={(e) => setAssignTopic(e.target.value)}>
              {TOPICS.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
            </select>
            <button onClick={assign} type="button">Assign study guide</button>
          </div>
        </div>
      )}
    </div>
  );
}

export function StudentClasses({ user, onOpenAssignment }: {
  user: User | null;
  onOpenAssignment?: (a: Assignment) => void;
}) {
  const [rooms, setRooms] = useState<Classroom[]>([]);
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");
  const [assigns, setAssigns] = useState<Record<string, Assignment[]>>({});

  const reload = async () => {
    const rs = await myLearningRooms();
    setRooms(rs);
    rs.forEach((r) => rememberClass(r.id));
    const map: Record<string, Assignment[]> = {};
    for (const r of rs) map[r.id] = await classAssignments(r.id);
    setAssigns(map);
  };
  useEffect(() => { if (user) reload(); });
  if (!supabaseConfigured() || !user) return null;

  const join = async () => {
    if (!code.trim()) return;
    const r = await joinClassroom(code);
    if (r.error) setMsg(r.error);
    else {
      setMsg("Joined!");
      setCode("");
      if (r.classroomId) rememberClass(r.classroomId);
      reload();
    }
  };

  return (
    <div className="panel">
      <h3 style={{ marginTop: 0 }}>My classes</h3>
      <div className="btnrow" style={{ marginTop: 0 }}>
        <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Invite code, e.g. FOX-4821" style={{ flex: 1 }} />
        <button className="primary" onClick={join} type="button">Join</button>
      </div>
      {msg && <p className="muted">{msg}</p>}
      {rooms.map((r) => (
        <div key={r.id} className="concept">
          <strong>{r.name}</strong>
          <ul>
            {(assigns[r.id] ?? []).map((a) => (
              <li key={a.id}>
                {a.kind === "guide" ? "Guide" : a.kind === "lesson" ? "Lesson" : "Game"}: {a.title}{" "}
                {onOpenAssignment && a.kind === "guide" && (
                  <button className="linkbtn" onClick={() => onOpenAssignment(a)} type="button">Open</button>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
