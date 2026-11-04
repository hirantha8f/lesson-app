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
        # Learn From Code — Primer home

        One Primer, three doors. Pick who is learning, set the age and interests,
        and the next step changes with you. This notebook is the interactive
        companion to the web app: no sign-in, no code upload, nothing leaves the page.
        """
    )
    return


@app.cell
def __(mo):
    persona = mo.ui.dropdown(
        options=["Student", "Teacher", "Parent"],
        value="Student",
        label="Who is learning today?",
    )
    age = mo.ui.slider(4, 18, step=1, value=10, label="Learner age")
    interest = mo.ui.dropdown(
        options=["gaming", "healthcare", "music", "cooking", "sports", "space", "general"],
        value="gaming",
        label="Interest used for analogies",
    )
    minutes = mo.ui.radio(
        options=["10 minutes", "20 minutes", "One lesson"],
        value="10 minutes",
        label="Time available",
    )
    mo.vstack([persona, age, interest, minutes])
    return age, interest, minutes, persona


@app.cell
def __(age, interest, minutes, mo, persona):
    routes = {
        "Student": ("Open the Student lab", "Run a tiny algorithm, predict first, then step through it."),
        "Teacher": ("Open the Teacher studio", "Turn a syllabus topic into objectives, misconceptions and a mark scheme."),
        "Parent": ("Open the Parent playground", "Play an unplugged game first, then drive the robot on screen."),
    }
    title, blurb = routes[persona.value]
    level = "playful, one idea at a time" if age.value <= 12 else "CS1 language with terms defined once"
    mo.md(
        f"""
        ## Your next step

        **{title}.** {blurb}

        - Reading level: {level}
        - Analogy world: {interest.value}
        - Session length: {minutes.value}

        Open the matching notebook from the marimo gallery. The web app keeps the
        long-term memory; this lab is for trying the idea with your hands.
        """
    )
    return


if __name__ == "__main__":
    app.run()
