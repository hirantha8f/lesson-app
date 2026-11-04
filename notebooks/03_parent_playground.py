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
        # Parent playground — thinking before typing

        For kitchens, sofas and bus stops. Pick your child's age and the time you
        actually have. You get one unplugged game and one robot puzzle to drive together.
        """
    )
    return


@app.cell
def __(mo):
    age = mo.ui.slider(4, 12, step=1, value=7, label="Child's age")
    minutes = mo.ui.radio(options=["10 minutes", "15 minutes", "30 minutes"], value="10 minutes", label="Time you have")
    skill = mo.ui.dropdown(
        options=["step-by-step recipes", "spot the pattern", "find the bug", "break big jobs down"],
        value="find the bug",
        label="Thinking skill",
    )
    mo.vstack([age, minutes, skill])
    return age, minutes, skill


@app.cell
def __(age, minutes, mo, skill):
    games = {
        "step-by-step recipes": ("Robot Breakfast", "bread, spread, a plate", "Be the robot. Follow your child's toast instructions literally. When it goes wrong, that is the bug to fix together."),
        "spot the pattern": ("Pattern Parrots", "blocks, beads or fruit", "Lay red-blue-red-blue and ask what comes next. Then let your child invent a pattern with a secret rule for you to crack."),
        "find the bug": ("Debug Dance", "music and space to move", "Invent a four-move dance. Secretly swap two moves. Your child shouts BUG at the wrong one, then you fix it and add a repeat."),
        "break big jobs down": ("Treasure Map Coder", "paper, crayons, a small toy", "Draw a 4 by 4 map, hide treasure, and write the route in arrows. Big job first, tiny steps second."),
    }
    title, materials, how = games[skill.value]
    mo.md(
        f"""
        ## Today's game: {title}

        **Ages around {age.value} · {minutes.value} · You need:** {materials}

        {how}

        Ask while you play: "What went wrong?" · "Which word would fix it?" · "Can you say the whole recipe now?"

        They just learned: computers follow steps exactly, and finding the wrong step is a skill with a name: debugging.
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
    verdict = "Crash! The robot fell off the board. Which step sent it wrong?" if crashed else ("Treasure! You coded that route." if (x, y) == goal else "Not there yet. Debug one step at a time.")
    mo.md(f"## Drive the robot to the star\n\n```text\n{board}\n```\n\n**{verdict}**")
    return


if __name__ == "__main__":
    app.run()
