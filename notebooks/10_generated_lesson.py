import marimo

__generated_with = "0.10.0"
app = marimo.App(width="medium")


@app.cell
def __():
    import json
    from pathlib import Path

    import marimo as mo

    _candidates = [
        Path("notebooks/generated/lesson.json"),
        Path("generated/lesson.json"),
        Path(__file__).resolve().parent / "generated" / "lesson.json",
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
        "filename": "quicksort.py",
        "lesson": {
            "language": "python",
            "fileSummary": "A tiny quicksort that picks a middle pivot and builds three lists: smaller, equal, larger.",
            "hook": "Ada the robot sorts her toy cars by size. She picks the middle car first.",
            "concepts": [
                {"title": "Pivot", "explanation": "One value splits the list into smaller and larger.", "codeRef": "pivot = xs[len(xs) // 2]"}
            ],
            "traceSteps": [
                {"step": "Pick pivot", "lineRef": "pivot = xs[1]", "vars": {"xs": "[3, 1, 2]", "pivot": "1"}, "note": "Middle value becomes the split point."},
                {"step": "Split", "lineRef": "left = [x for x in xs if x < pivot]", "vars": {"left": "[]", "mid": "[1]", "right": "[3, 2]"}, "note": "Everything is compared once."},
            ],
            "quiz": [
                {
                    "question": "Why must the pivot split the list?",
                    "options": ["To sort smaller and larger groups separately", "To delete duplicates", "To print the list", "To count lines"],
                    "correctIndex": 0,
                    "explanation": "Quicksort sorts the two smaller problems, then joins them.",
                }
            ],
            "parsons": {"lines": ["def quicksort(xs):", "    if len(xs) <= 1:", "        return xs", "    pivot = xs[len(xs) // 2]"]},
        },
    }
    data = (_payload or {}).get("data") or _sample
    lesson = data["lesson"]
    filename = data.get("filename", "lesson")
    trace_steps = lesson.get("traceSteps") or []
    quiz_items = lesson.get("quiz") or []
    parsons_lines = (lesson.get("parsons") or {}).get("lines") or []
    return data, filename, lesson, mo, parsons_lines, quiz_items, trace_steps


@app.cell
def __(filename, lesson, mo):
    mo.md(
        f"""
        # {filename} — your lesson, live in marimo

        **{lesson.get('hook', '')}**

        {lesson.get('fileSummary', '')}

        Language: `{lesson.get('language', '')}` · This page was generated from your
        web-app lesson. Move the sliders, answer the checks, rearrange the code.
        """
    )
    return


@app.cell
def __(lesson, mo):
    _blocks = ["## Key concepts"]
    for _c in lesson.get("concepts", []):
        _blocks.append(f"### {_c.get('title', '')}\n\n{_c.get('explanation', '')}\n\n```\n{_c.get('codeRef', '')}\n```")
    mo.md("\n\n".join(_blocks))
    return


@app.cell
def __(mo, trace_steps):
    step_index = mo.ui.slider(1, max(1, len(trace_steps)), step=1, value=1, label="Step through the code")
    step_index
    return (step_index,)


@app.cell
def __(mo, step_index, trace_steps):
    if trace_steps:
        _s = trace_steps[min(step_index.value, len(trace_steps)) - 1]
        _vars = ", ".join(f"{_k} = {_v}" for _k, _v in (_s.get("vars") or {}).items()) or "no variables captured"
        _text = f"### Step {step_index.value}: {_s.get('step', '')}\n\n`{_s.get('lineRef', '')}`\n\n**State:** {_vars}\n\n{_s.get('note', '')}"
    else:
        _text = "No trace steps in this lesson."
    mo.md(_text)
    return


@app.cell
def __(mo, quiz_items):
    q_index = mo.ui.slider(1, max(1, len(quiz_items)), step=1, value=1, label="Quiz question")
    q_index
    return (q_index,)


@app.cell
def __(mo, q_index, quiz_items):
    _q = quiz_items[min(q_index.value, len(quiz_items)) - 1] if quiz_items else None
    answer = (
        mo.ui.radio(options=list(_q.get("options", [])), label=f"Q{q_index.value}. {_q.get('question', '')}")
        if _q
        else None
    )
    answer
    return (answer,)


@app.cell
def __(answer, mo, q_index, quiz_items):
    if quiz_items and answer is not None:
        _q = quiz_items[min(q_index.value, len(quiz_items)) - 1]
        _options = list(_q.get("options", []))
        _correct = _options[_q.get("correctIndex", 0)] if _options else ""
        if answer.value is None:
            _msg = "Predict, then pick. Your web journey map is watching."
        elif answer.value == _correct:
            _msg = f"**Correct.** {_q.get('explanation', '')}"
        else:
            _msg = f"Not quite. {_q.get('explanation', '')}"
    else:
        _msg = "No quiz in this lesson."
    mo.md(_msg)
    return


@app.cell
def __(mo, parsons_lines):
    if parsons_lines:
        _scrambled = list(reversed(parsons_lines))
        _listing = "\n".join(f"{_i + 1}. `{_line}`" for _i, _line in enumerate(_scrambled))
        mo.md(f"## Put it in order\n\n{_listing}\n\nType the line numbers in the right order, like `2 1 3`.")
    order = mo.ui.text(label="Your order") if parsons_lines else None
    order
    return (order,)


@app.cell
def __(mo, order, parsons_lines):
    if parsons_lines and order is not None and order.value.strip():
        _scrambled = list(reversed(parsons_lines))
        try:
            _picked = [_scrambled[int(_x) - 1] for _x in order.value.replace(",", " ").split()]
            _msg = "**Correct order.** That is exactly how the code runs." if _picked == parsons_lines else "Not yet. Trace the data flow from top to bottom and try again."
        except Exception:
            _msg = "Use line numbers separated by spaces, like `2 1 3`."
    else:
        _msg = "Type your order above when ready."
    mo.md(_msg)
    return


if __name__ == "__main__":
    app.run()
