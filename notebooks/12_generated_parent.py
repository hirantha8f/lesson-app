import marimo

__generated_with = "0.10.0"
app = marimo.App(width="medium")


@app.cell
def __():
    import json
    from pathlib import Path

    import marimo as mo

    candidates = [
        Path("notebooks/generated/parent.json"),
        Path("generated/parent.json"),
        Path(__file__).resolve().parent / "generated" / "parent.json",
    ]
    payload = None
    for candidate in candidates:
        try:
            if candidate.exists():
                payload = json.loads(candidate.read_text(encoding="utf-8"))
                break
        except Exception:
            pass

    sample = {
        "title": "Debug Dance",
        "ages": [4, 9],
        "minutes": 10,
        "materials": ["music", "space to move"],
        "steps": ["Invent a four-move dance.", "Secretly swap two moves.", "Your child shouts BUG at the wrong one.", "Fix it and add a repeat."],
        "ask": ["Where exactly was the bug?", "How did you know?"],
        "learned": "Testing, debugging and loops through movement.",
        "robot": None,
    }
    activity = (payload or {}).get("data") or sample
    return activity, mo


@app.cell
def __(activity, mo):
    steps = "\n".join(f"{i + 1}. {s}" for i, s in enumerate(activity.get("steps", [])))
    asks = "\n".join(f"- {q}" for q in activity.get("ask", []))
    mo.md(
        f"""
        # {activity.get('title', 'Activity')} — tonight's game

        Ages {activity.get('ages', ['?', '?'])[0]}-{activity.get('ages', ['?', '?'])[1]} · about {activity.get('minutes', 10)} minutes

        **You need:** {', '.join(activity.get('materials', []))}

        ## How to play

        {steps}

        ## Ask while you play

        {asks}

        **They just learned:** {activity.get('learned', '')}
        """
    )
    return


@app.cell
def __(mo):
    route = mo.ui.text(value="F F R F", label="Robot route (F forward, L left, R right)")
    route
    return (route,)


@app.cell
def __(mo, route):
    size = 4
    x, y, d = 0, 0, 0
    dx = [1, 0, -1, 0]
    dy = [0, 1, 0, -1]
    arrows = ["→", "↓", "←", "↑"]
    goal = (3, 3)
    crashed = False
    for cmd in route.value.upper().split():
        if cmd == "L":
            d = (d + 3) % 4
        elif cmd == "R":
            d = (d + 1) % 4
        elif cmd == "F":
            nx, ny = x + dx[d], y + dy[d]
            if nx < 0 or ny < 0 or nx >= size or ny >= size:
                crashed = True
                break
            x, y = nx, ny
    rows = []
    for yy in range(size):
        cells = []
        for xx in range(size):
            cells.append(arrows[d] if (xx, yy) == (x, y) else ("★" if (xx, yy) == goal else "·"))
        rows.append(" ".join(cells))
    board = "\n".join(rows)
    verdict = "Crash! Which step sent the robot wrong?" if crashed else ("Treasure! You coded that route." if (x, y) == goal else "Not there yet. Debug one step at a time.")
    mo.md(f"## Drive the robot to the star\n\n```text\n{board}\n```\n\n**{verdict}**")
    return


if __name__ == "__main__":
    app.run()
