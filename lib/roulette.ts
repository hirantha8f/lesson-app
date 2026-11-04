// Roulette pool: curated, small, demo-safe snippets inspired by real repos.
// Each entry carries attribution + embedded fallback code so the demo works
// offline. The API route tries a live fetch from raw.githubusercontent.com
// first and falls back to `code` below.

export type RouletteItem = {
  id: string;
  title: string;
  category: "Games" | "Web" | "AI" | "Algorithms";
  concept: string;
  difficulty: "starter" | "intermediate";
  repo: string; // attribution, e.g. "lodash/lodash"
  path: string; // attribution path
  rawUrl?: string; // live fetch attempt (must be small + stable)
  language: string;
  code: string;
  whyFun: string;
};

export const ROULETTE_ITEMS: RouletteItem[] = [
  {
    id: "debounce",
    title: "Debounce — search-box superpower",
    category: "Web",
    concept: "closures + timers",
    difficulty: "starter",
    repo: "lodash/lodash",
    path: "debounce.js (simplified)",
    language: "javascript",
    whyFun: "The 20 lines behind every search autocomplete box.",
    code: `function debounce(fn, wait) {
  let timeoutId = null;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), wait);
  };
}

// demo: only the LAST keystroke within 300ms fires
const search = debounce((q) => console.log("search for", q), 300);
search("h"); search("he"); search("hel"); search("hell"); search("hello");
`,
  },
  {
    id: "snake-loop",
    title: "Snake game loop",
    category: "Games",
    concept: "game loop + arrays",
    difficulty: "starter",
    repo: "examples / canonical game loop",
    path: "snake.js",
    language: "javascript",
    whyFun: "Move, eat, grow, crash — a whole game in 40 lines.",
    code: `const snake = [{ x: 5, y: 5 }, { x: 4, y: 5 }];
let dir = { x: 1, y: 0 };
let food = { x: 8, y: 5 };

function step() {
  const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
  const ate = head.x === food.x && head.y === food.y;
  snake.unshift(head); // grow head
  if (!ate) snake.pop(); // shrink tail unless eating
  else food = { x: Math.floor(Math.random() * 10), y: Math.floor(Math.random() * 10) };
  return ate ? "yum!" : "slither";
}
console.log(step());
`,
  },
  {
    id: "bfs",
    title: "BFS pathfinding",
    category: "Algorithms",
    concept: "queues + graphs",
    difficulty: "intermediate",
    repo: "examples / canonical BFS",
    path: "bfs.py",
    language: "python",
    whyFun: "How NPCs find you through a maze.",
    code: `from collections import deque

def bfs(grid, start, goal):
    q = deque([(start, [start])])
    seen = {start}
    while q:
        (x, y), path = q.popleft()
        if (x, y) == goal:
            return path
        for dx, dy in [(1,0),(-1,0),(0,1),(0,-1)]:
            n = (x+dx, y+dy)
            if n not in seen and grid[n[1]][n[0]] == 0:
                seen.add(n)
                q.append((n, path + [n]))
    return None
`,
  },
  {
    id: "quicksort",
    title: "Quicksort in 15 lines",
    category: "Algorithms",
    concept: "recursion + divide & conquer",
    difficulty: "starter",
    repo: "examples / canonical quicksort",
    path: "quicksort.py",
    language: "python",
    whyFun: "The sorting interview classic, animated.",
    code: `def quicksort(xs):
    if len(xs) <= 1:
        return xs
    pivot = xs[len(xs) // 2]
    left = [x for x in xs if x < pivot]
    mid = [x for x in xs if x == pivot]
    right = [x for x in xs if x > pivot]
    return quicksort(left) + mid + quicksort(right)

print(quicksort([3, 6, 1, 8, 2, 5]))
`,
  },
  {
    id: "rate-limiter",
    title: "Token-bucket rate limiter",
    category: "Web",
    concept: "time + state",
    difficulty: "intermediate",
    repo: "examples / API middleware pattern",
    path: "rateLimit.js",
    language: "javascript",
    whyFun: "How APIs say 'slow down' without crashing.",
    code: `function createLimiter(capacity, refillPerSec) {
  let tokens = capacity;
  let last = Date.now();
  return function allow(cost = 1) {
    const now = Date.now();
    tokens = Math.min(capacity, tokens + ((now - last) / 1000) * refillPerSec);
    last = now;
    if (tokens >= cost) { tokens -= cost; return true; }
    return false;
  };
}
const allow = createLimiter(5, 1);
console.log([allow(), allow(), allow(), allow(), allow(), allow()]);
`,
  },
  {
    id: "tokens",
    title: "Chat token counter",
    category: "AI",
    concept: "tokenization basics",
    difficulty: "starter",
    repo: "examples / LLM plumbing",
    path: "tokens.py",
    language: "python",
    whyFun: "Why ChatGPT charges you per word-ish.",
    code: `import re

def rough_tokens(text):
    # toy tokenizer: words + punctuation, ~0.75 words per token
    parts = re.findall(r"\\w+|[^\\w\\s]", text)
    return parts, len(parts)

parts, n = rough_tokens("Hello, world! How are you?")
print(parts, "->", n, "tokens")
print("est. cost @ $0.002/1k:", round(n / 1000 * 0.002, 6))
`,
  },
  {
    id: "kmeans-step",
    title: "K-means single step",
    category: "AI",
    concept: "loops + distance",
    difficulty: "intermediate",
    repo: "examples / ML from scratch",
    path: "kmeans.py",
    language: "python",
    whyFun: "Cluster customers in 25 lines, no library.",
    code: `def dist(a, b):
    return sum((x - y) ** 2 for x, y in zip(a, b)) ** 0.5

def kmeans_step(points, centroids):
    clusters = {i: [] for i in range(len(centroids))}
    for p in points:
        best = min(range(len(centroids)), key=lambda i: dist(p, centroids[i]))
        clusters[best].append(p)
    new_c = []
    for i, pts in clusters.items():
        if not pts:
            new_c.append(centroids[i]); continue
        dims = zip(*pts)
        new_c.append([sum(d) / len(pts) for d in dims])
    return clusters, new_c
`,
  },
  {
    id: "csv-parser",
    title: "Tiny CSV parser",
    category: "Web",
    concept: "state machines",
    difficulty: "intermediate",
    repo: "examples / parsing pattern",
    path: "csv.js",
    language: "javascript",
    whyFun: "Quotes inside quotes broke your spreadsheet once.",
    code: `function parseCSV(text) {
  const rows = []; let row = [], field = "", inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"') {
        if (text[i+1] === '"') { field += '"'; i++; }
        else inQ = false;
      } else field += c;
    } else if (c === '"') inQ = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else field += c;
  }
  row.push(field); rows.push(row);
  return rows;
}
console.log(parseCSV('a,b\\n"hi, there",c'));
`,
  },
  {
    id: "jwt-lite",
    title: "JWT verify (simplified)",
    category: "Web",
    concept: "hashing + auth",
    difficulty: "intermediate",
    repo: "examples / auth pattern",
    path: "jwt.js",
    language: "javascript",
    whyFun: "How 'Log in with Google' remembers you.",
    code: `// DO NOT use in prod — simplified to teach the shape
function b64url(json) {
  return Buffer.from(JSON.stringify(json)).toString("base64url");
}
function signUnsigned(unsigned, secret) {
  let h = 0; // toy hash, stands in for HMAC-SHA256
  for (const ch of unsigned + secret) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h.toString(36);
}
function verify(token, secret) {
  const [h, p, s] = token.split(".");
  return signUnsigned(h + "." + p, secret) === s ? JSON.parse(Buffer.from(p, "base64url").toString()) : null;
}
`,
  },
  {
    id: "todo-api",
    title: "Todo REST handler",
    category: "Web",
    concept: "CRUD + HTTP",
    difficulty: "starter",
    repo: "examples / REST pattern",
    path: "todos.js",
    language: "javascript",
    whyFun: "Every app you use is this + styling.",
    code: `const todos = [{ id: 1, text: "spin roulette", done: false }];

function handle(req) {
  if (req.method === "GET") return { status: 200, body: todos };
  if (req.method === "POST") {
    const item = { id: Date.now(), text: req.body.text, done: false };
    todos.push(item);
    return { status: 201, body: item };
  }
  if (req.method === "PATCH") {
    const t = todos.find((x) => x.id === req.body.id);
    if (!t) return { status: 404, body: "not found" };
    t.done = !t.done;
    return { status: 200, body: t };
  }
  return { status: 405, body: "method not allowed" };
}
`,
  },
];

export function spinRoulette(
  category?: RouletteItem["category"] | "Any"
): RouletteItem {
  const pool =
    !category || category === "Any"
      ? ROULETTE_ITEMS
      : ROULETTE_ITEMS.filter((r) => r.category === category);
  return pool[Math.floor(Math.random() * pool.length)] ?? ROULETTE_ITEMS[0];
}

export function getRouletteById(id: string): RouletteItem | undefined {
  return ROULETTE_ITEMS.find((r) => r.id === id);
}
