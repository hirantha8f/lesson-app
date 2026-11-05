import marimo

__generated_with = "0.10.0"
app = marimo.App(width="medium")


@app.cell
def __():
    import json
    from pathlib import Path

    import marimo as mo

    _candidates = [
        Path("notebooks/generated/guide.json"),
        Path("generated/guide.json"),
        Path(__file__).resolve().parent / "generated" / "guide.json",
    ]
    _payload = None
    for _candidate in _candidates:
        try:
            if _candidate.exists():
                _payload = json.loads(_candidate.read_text(encoding="utf-8"))
                break
        except Exception:
            pass

    _sample = {
        "topic": {"title": "Sorting & searching"},
        "guide": {
            "topic": "Sorting & searching",
            "summary": "Pupils learn why binary search is fast and when it refuses to work.",
            "pupilVersion": "Imagine finding a word in a dictionary by opening the middle page again and again.",
            "keyIdeas": [{"title": "Sorted first", "detail": "Binary search only works on sorted data."}],
            "misconceptions": [{"myth": "Binary search checks every item", "reality": "It halves the list each step", "check": "Ask: after one comparison, how many items remain?"}],
            "examQs": [{"q": "State why the list must be sorted before binary search.", "marks": 1, "markScheme": "Comparisons only discard half when order is known (1)."}],
            "retrieval": [],
            "classroomActivity": {"title": "Human binary search", "minutes": 10, "steps": "Number 16 pupils, hunt for a hidden number by halving."},
        },
    }
    data = (_payload or {}).get("data") or _sample
    guide = data["guide"]
    return data, guide, mo


@app.cell
def __(guide, mo):
    mo.md(f"# {guide.get('topic', 'Study guide')} — live in marimo\n\n{guide.get('summary', '')}\n\n**Say it to pupils:** {guide.get('pupilVersion', '')}")
    return


@app.cell
def __(guide, mo):
    _blocks = ["## Key ideas"]
    for _i, _k in enumerate(guide.get("keyIdeas", []), 1):
        _blocks.append(f"### {_i}. {_k.get('title', '')}\n\n{_k.get('detail', '')}")
    _blocks.append("## Misconceptions to pre-empt")
    for _m in guide.get("misconceptions", []):
        _blocks.append(f"- **Not quite:** {_m.get('myth', '')}\n- **Actually:** {_m.get('reality', '')}\n- Diagnostic: {_m.get('check', '')}")
    mo.md("\n\n".join(_blocks))
    return


@app.cell
def __(mo):
    reveal = mo.ui.checkbox(label="Reveal mark scheme")
    reveal
    return (reveal,)


@app.cell
def __(guide, mo, reveal):
    _blocks = ["## Exam-style questions"]
    for _i, _q in enumerate(guide.get("examQs", []), 1):
        _blocks.append(f"**Q{_i} [{_q.get('marks', 0)} marks]** {_q.get('q', '')}")
        if reveal.value:
            _blocks.append(f"Mark scheme: {_q.get('markScheme', '')}")
    _act = guide.get("classroomActivity") or {}
    if _act:
        _blocks.append(f"## Class activity ({_act.get('minutes', '')} min): {_act.get('title', '')}\n\n{_act.get('steps', '')}")
    mo.md("\n\n".join(_blocks))
    return


if __name__ == "__main__":
    app.run()
