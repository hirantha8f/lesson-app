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
        # Student lab — see the code move

        Predict first. Then run. Then change one thing. That order is the lesson.
        Pick an algorithm, set the input size, and step through what the code does.
        """
    )
    return


@app.cell
def __(mo):
    algo = mo.ui.dropdown(
        options=["quicksort", "binary search", "bubble sort"],
        value="quicksort",
        label="Algorithm",
    )
    n = mo.ui.slider(4, 10, step=1, value=7, label="How many numbers?")
    speed = mo.ui.radio(
        options=["Predict first", "Just show me"],
        value="Predict first",
        label="Mode",
    )
    mo.vstack([algo, n, speed])
    return algo, n, speed


@app.cell
def __(algo, n):
    import random

    rng = random.Random(42)
    data = rng.sample(range(1, 50), n.value)

    def quicksort(xs):
        if len(xs) <= 1:
            return xs, 0
        pivot = xs[len(xs) // 2]
        left = [x for x in xs if x < pivot]
        mid = [x for x in xs if x == pivot]
        right = [x for x in xs if x > pivot]
        a, ca = quicksort(left)
        b, cb = quicksort(right)
        return a + mid + b, ca + cb + len(xs)

    def bubble(xs):
        xs = list(xs)
        comparisons = 0
        for i in range(len(xs)):
            for j in range(len(xs) - 1 - i):
                comparisons += 1
                if xs[j] > xs[j + 1]:
                    xs[j], xs[j + 1] = xs[j + 1], xs[j]
        return xs, comparisons

    def binary(xs, target):
        lo, hi = 0, len(xs) - 1
        steps = 0
        while lo <= hi:
            steps += 1
            mid = (lo + hi) // 2
            if xs[mid] == target:
                return mid, steps
            if xs[mid] < target:
                lo = mid + 1
            else:
                hi = mid - 1
        return -1, steps

    sorted_data, comparisons = quicksort(data) if algo.value == "quicksort" else bubble(data)
    target = sorted_data[len(sorted_data) // 2]
    found_at, search_steps = binary(sorted_data, target)
    result = {
        "data": data,
        "sorted": sorted_data,
        "comparisons": comparisons,
        "target": target,
        "found_at": found_at,
        "search_steps": search_steps,
    }
    return result,


@app.cell
def __(algo, mo, result, speed):
    prediction_note = (
        "Before you read the result: say out loud where the middle number will land. "
        "That guess is the learning."
        if speed.value == "Predict first"
        else "Result first this time. Next round, switch to Predict first."
    )
    mo.md(
        f"""
        ## {algo.value.title()} on {result['data']}

        {prediction_note}

        - Sorted: `{result['sorted']}`
        - Comparisons counted: **{result['comparisons']}**
        - Binary search for `{result['target']}` found index **{result['found_at']}** in **{result['search_steps']}** steps

        Change one thing: drag the count slider and watch comparisons grow faster
        than the list. That growth is why algorithm choice matters.
        """
    )
    return


@app.cell
def __(mo):
    answer = mo.ui.radio(
        options=[
            "It checks every number once",
            "It splits the sorted list in half each step",
            "It swaps neighbours until calm",
        ],
        label="Check: why is binary search fast?",
    )
    answer
    return (answer,)


@app.cell
def __(answer, mo):
    if answer.value is None:
        msg = "Pick an answer when you are ready."
    elif "splits" in answer.value:
        msg = "**Correct.** Each step throws away half the list. That is the whole trick."
    else:
        msg = "Not quite. Binary search never scans one by one: it halves the sorted list each step."
    mo.md(msg)
    return


if __name__ == "__main__":
    app.run()
