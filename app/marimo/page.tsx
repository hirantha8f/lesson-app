const NOTEBOOKS = [
  {
    id: "00_primer_home",
    title: "Primer home",
    audience: "Everyone",
    blurb: "Pick a persona, age and interest. Your next step changes with you.",
  },
  {
    id: "01_student_lab",
    title: "Student lab",
    audience: "Students",
    blurb: "Predict first, then watch quicksort, bubble sort and binary search move.",
  },
  {
    id: "02_teacher_studio",
    title: "Teacher studio",
    audience: "Teachers",
    blurb: "Topic, level and minutes in; objectives, misconception, exam question and mark scheme out.",
  },
  {
    id: "03_parent_playground",
    title: "Parent playground",
    audience: "Parents",
    blurb: "One unplugged game plus a robot route to debug together, in ten minutes.",
  },
];

export default function MarimoPage() {
  const marimoUrl = process.env.NEXT_PUBLIC_MARIMO_URL;

  return (
    <div className="shell">
      <aside className="rail">
        <p className="wordmark">Learn From Code<small>a Primer that grows with you</small></p>
        <a href="/"><button className="navitem" type="button">Back to paths</button></a>
        <div className="railfoot">Interactive lab</div>
      </aside>
      <div className="body">
        <header className="topbar">
          <span className="muted">Marimo interactive lab</span>
          <span className="spacer" />
          <a href="/"><button type="button">Web app</button></a>
        </header>
        <main>
          <h1>Try it with your hands</h1>
          <p>
            The web app remembers each learner. This lab is where every user can
            move the pieces themselves: students run algorithms, teachers draft
            lessons, parents play the robot game. Built with marimo, the reactive
            Python notebook that runs as an app.
          </p>

          {marimoUrl ? (
            <div className="panel">
              <iframe
                src={marimoUrl}
                title="Marimo interactive lab"
                style={{ width: "100%", height: 720, border: 0, borderRadius: 12 }}
              />
            </div>
          ) : (
            <div className="panel">
              <iframe
                src="/marimo/index.html"
                title="Marimo interactive lab (static export)"
                style={{ width: "100%", height: 720, border: 0, borderRadius: 12 }}
              />
              <p className="muted" style={{ marginTop: 10 }}>
                This is the self-contained static export: it runs entirely in your
                browser. The generated-content notebooks show sample lessons here;
                for your own generated lessons, run the marimo server locally
                (<code>npm run marimo:gallery</code>) and set{" "}
                <code>NEXT_PUBLIC_MARIMO_URL</code> to embed it instead.
              </p>
            </div>
          )}

          <div className="personagrid">
            {NOTEBOOKS.map((n) => (
              <div key={n.id} className="concept" style={{ marginBottom: 0 }}>
                <strong>{n.title}</strong>
                <p className="faint">{n.audience}</p>
                <p className="muted">{n.blurb}</p>
                <code>{`${n.id}.py`}</code>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
