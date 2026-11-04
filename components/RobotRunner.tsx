"use client";

import { useEffect, useRef, useState } from "react";
import type { Cmd, RobotChallenge } from "@/lib/activities";

const ARROWS = ["→", "↓", "←", "↑"]; // dir 0=E 1=S 2=W 3=N
const DX = [1, 0, -1, 0];
const DY = [0, 1, 0, -1];

// Decision 4: IN-APP runner. Zero-dep grid robot: build a command sequence,
// watch it execute, debug it when it crashes. Sequencing + debugging for kids.
export default function RobotRunner({ challenge }: { challenge: RobotChallenge }) {
  const [program, setProgram] = useState<Cmd[]>(challenge.buggy ?? []);
  const [pos, setPos] = useState<[number, number]>(challenge.start);
  const [dir, setDir] = useState(challenge.dir);
  const [running, setRunning] = useState(false);
  const [msg, setMsg] = useState(
    challenge.buggy ? "This program has a BUG — run it, spot it, fix it!" : "Build your route, then press Run!"
  );
  const [won, setWon] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setProgram(challenge.buggy ?? []);
    setPos(challenge.start);
    setDir(challenge.dir);
    setWon(false);
    setMsg(
      challenge.buggy ? "This program has a BUG — run it, spot it, fix it!" : "Build your route, then press Run!"
    );
  }, [challenge]);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const reset = () => {
    if (timer.current) clearTimeout(timer.current);
    setRunning(false);
    setPos(challenge.start);
    setDir(challenge.dir);
    setWon(false);
  };

  const run = () => {
    reset();
    setRunning(true);
    setMsg("Running…");
    let p: [number, number] = [...challenge.start] as [number, number];
    let d = challenge.dir;
    let i = 0;
    const step = () => {
      if (i >= program.length) {
        setRunning(false);
        const atGoal = p[0] === challenge.goal[0] && p[1] === challenge.goal[1];
        setMsg(atGoal ? "Treasure! You coded that route!" : "Hmm — didn't reach the star. Debug and try again!");
        setWon(atGoal);
        return;
      }
      const c = program[i++];
      if (c === "L") d = (d + 3) % 4;
      else if (c === "R") d = (d + 1) % 4;
      else {
        const nx = p[0] + DX[d];
        const ny = p[1] + DY[d];
        if (nx < 0 || ny < 0 || nx >= challenge.size || ny >= challenge.size) {
          setRunning(false);
          setMsg(`Crash at step ${i}! The robot fell off. Fix the route!`);
          return;
        }
        p = [nx, ny];
      }
      setPos(p);
      setDir(d as 0 | 1 | 2 | 3);
      timer.current = setTimeout(step, 450);
    };
    timer.current = setTimeout(step, 450);
  };

  const add = (c: Cmd) => {
    if (running || program.length >= challenge.maxBlocks) return;
    reset();
    setProgram([...program, c]);
  };

  return (
    <div className="concept">
      <h3 style={{ marginTop: 0 }}>{challenge.title}</h3>
      <div
        className="robotgrid"
        style={{ gridTemplateColumns: `repeat(${challenge.size}, 44px)` }}
      >
        {Array.from({ length: challenge.size * challenge.size }, (_, k) => {
          const x = k % challenge.size;
          const y = Math.floor(k / challenge.size);
          const isRobot = pos[0] === x && pos[1] === y;
          const isGoal = challenge.goal[0] === x && challenge.goal[1] === y;
          return (
            <div key={k} className={`robotcell${isGoal ? " goal" : ""}`}>
              {isRobot ? ARROWS[dir] : isGoal ? "★" : ""} {/* taste-skill-ignore: game-board goal marker, text presentation, no emoji font */}
            </div>
          );
        })}
      </div>
      <div className="btnrow">
        {(["F", "L", "R"] as Cmd[]).map((c) => (
          <button key={c} onClick={() => add(c)} disabled={running} type="button">
            {c === "F" ? "Forward" : c === "L" ? "Turn left" : "Turn right"}
          </button>
        ))}
        <button onClick={() => { reset(); setProgram([]); }} disabled={running} type="button">Clear</button>
        <button className="primary" onClick={run} disabled={running || !program.length} type="button">
          Run ({program.length}/{challenge.maxBlocks})
        </button>
      </div>
      <p className="muted">
        Program: {program.length ? program.join(" ") : "— empty —"}
      </p>
      <p className={won ? "good" : ""}>{msg}</p>
    </div>
  );
}
