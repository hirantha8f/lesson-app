"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import {
  currentUser,
  signIn,
  signOut,
  signUp,
  supabaseConfigured,
} from "@/lib/supabase";

export default function AuthPanel({ onAuth }: { onAuth: (u: User | null) => void }) {
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"teacher" | "student" | "parent">("student");
  const [name, setName] = useState("");
  const [mode, setMode] = useState<"in" | "up">("in");
  const [msg, setMsg] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    currentUser().then((u) => {
      setUser(u);
      onAuth(u);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!supabaseConfigured()) return null;

  const refresh = async () => {
    const u = await currentUser();
    setUser(u);
    onAuth(u);
  };

  const submit = async () => {
    setMsg("");
    if (mode === "up") {
      const r = await signUp(email.trim(), password, role, name.trim() || email.split("@")[0]);
      if (r.error) setMsg(r.error);
      else if (r.needsConfirm) setMsg("Check your email to confirm, then sign in.");
      else await refresh();
    } else {
      const r = await signIn(email.trim(), password);
      if (r.error) setMsg(r.error);
      else await refresh();
    }
  };

  if (user) {
    return (
      <div className="panel" style={{ padding: "8px 12px" }}>
        <span className="muted">{user.email}</span>{" "}
        <button
          onClick={async () => { await signOut(); setUser(null); onAuth(null); }}
          type="button"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <div className="panel">
      <button className="rowbtn" onClick={() => setOpen((v) => !v)} type="button">
        <span>Classroom sign-in (optional — lessons work without it)</span>
        <span style={{ opacity: 0.6 }}>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
          <div className="btnrow" style={{ marginTop: 0 }}>
            <button onClick={() => setMode("in")} disabled={mode === "in"} type="button">Sign in</button>
            <button onClick={() => setMode("up")} disabled={mode === "up"} type="button">Create account</button>
          </div>
          <label>Email<input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@school.edu" /></label>
          <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
          {mode === "up" && (
            <>
              <label>Display name<input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ms Ada" /></label>
              <label>Role
                <select value={role} onChange={(e) => setRole(e.target.value as any)}>
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="parent">Parent</option>
                </select>
              </label>
            </>
          )}
          <button className="primary" onClick={submit} type="button">
            {mode === "up" ? "Create account" : "Sign in"}
          </button>
          {msg && <p className={msg.startsWith("Check") ? "good" : "error"}>{msg}</p>}
        </div>
      )}
    </div>
  );
}
