import marimo

__generated_with = "0.10.0"
app = marimo.App(width="medium")


@app.cell
def __():
    import marimo as mo

    return (mo,)


@app.cell
def __(mo):
    mo.md(
        """
        # Teacher studio — from topic to lesson

        Choose a syllabus topic, class level and lesson length. The studio drafts
        the parts teachers rewrite least willingly at 10pm: objectives, likely
        misconceptions, an exam-style question and a mark scheme.
        """
    )
    return


@app.cell
def __(mo):
    topics = {
        "Decomposition & abstraction": ["Edexcel T1", "OCR 2.1", "AQA 3.1", "CSTA 3A-AP-13"],
        "Sorting & searching": ["Edexcel T1", "OCR 2.1", "AQA 3.1", "CSTA 3A-AP-16"],
        "Binary & data representation": ["Edexcel T2", "OCR 1.2", "AQA 3.4"],
        "Programming fundamentals": ["Edexcel T6", "OCR 2.2", "AQA 3.2"],
        "Robust programs & testing": ["Edexcel T6", "OCR 2.3", "AQA 3.2"],
    }
    topic = mo.ui.dropdown(options=list(topics), value="Sorting & searching", label="Syllabus topic")
    level = mo.ui.dropdown(
        options=["Primary / KS2", "KS3 (11-14)", "GCSE (14-16)", "A-Level / IB"],
        value="GCSE (14-16)",
        label="Class level",
    )
    minutes = mo.ui.slider(30, 90, step=15, value=60, label="Lesson length (minutes)")
    focus = mo.ui.multiselect(
        options=["Misconceptions first", "Exam technique", "Unplugged start", "Differentiation"],
        value=["Misconceptions first"],
        label="Lesson focus",
    )
    mo.vstack([topic, level, minutes, focus])
    return focus, level, minutes, topic, topics


@app.cell
def __(focus, level, minutes, mo, topic, topics):
    starter = max(5, minutes.value // 6)
    main = minutes.value - starter - 10
    misconceptions = {
        "Sorting & searching": "Pupils think binary search works on any list. It needs a sorted list first.",
        "Decomposition & abstraction": "Pupils split a problem into pieces but cannot say what each piece should return.",
        "Binary & data representation": "Pupils read 1010 as 'one thousand and ten' instead of a binary value.",
        "Programming fundamentals": "Pupils treat = as 'equals' in every context, including assignment.",
        "Robust programs & testing": "Pupils test only the happy path and call the program robust.",
    }
    refs = ", ".join(topics[topic.value])
    focus_line = ", ".join(focus.value) if focus.value else "balanced lesson"
    mo.md(
        f"""
        ## Draft plan: {topic.value}

        **Level:** {level.value} · **Length:** {minutes.value} minutes · **Refs:** {refs} · **Focus:** {focus_line}

        ### Timing
        - Starter retrieval: {starter} minutes
        - Main teaching and practice: {main} minutes
        - Plenary check: 10 minutes

        ### Objective
        Pupils can explain {topic.value.lower()} in their own words and apply it to a new example without copying the worked one.

        ### Misconception to pre-empt
        {misconceptions[topic.value]}

        ### Exam-style question (4 marks)
        A list of 8 sorted numbers is searched for a target using binary search.
        Describe the first two comparisons and state why the list must be sorted.

        **Mark scheme:** sorted requirement (1), correct first midpoint comparison (1),
        correct narrowing of the search range (1), clear sequencing of the second comparison (1).
        Accept equivalent wording.

        ### Exit ticket
        One sentence: "Today I can tell when this method will fail because ..."
        """
    )
    return


if __name__ == "__main__":
    app.run()
