// Embedded parent activities (decision: no fixed age floor, unplugged-first).
// Instant + offline-safe for demos; LLM custom generation can layer on later.

export type Cmd = "F" | "L" | "R";

export type RobotChallenge = {
  id: string;
  title: string;
  size: number;
  start: [number, number];
  dir: 0 | 1 | 2 | 3; // 0=E 1=S 2=W 3=N
  goal: [number, number];
  maxBlocks: number;
  buggy?: Cmd[];
};

export type Activity = {
  id: string;
  title: string;
  ages: [number, number];
  minutes: number;
  materials: string[];
  steps: string[];
  ask: string[];
  learned: string;
  robot?: RobotChallenge;
};

export const ACTIVITIES: Activity[] = [
  {
    id: "robot-breakfast",
    title: "Robot Breakfast",
    ages: [4, 9],
    minutes: 10,
    materials: ["bread", "butter/spread", "a plate"],
    steps: [
      "You are the robot. The child must tell you how to make toast — one tiny step at a time.",
      "Follow instructions LITERALLY. Told to 'put butter on'? Smear it on the table. Laugh together.",
      "Let the child fix the 'bug' by giving a more exact step.",
      "Swap roles: you give steps, the child is the robot.",
    ],
    ask: ["What went wrong?", "Which word would fix it?", "Can you say the whole recipe now?"],
    learned: "Computers follow steps exactly — exact sequencing and debugging.",
    robot: {
      id: "robot-toast",
      title: "Drive the robot to the toast",
      size: 4,
      start: [0, 0],
      dir: 0,
      goal: [3, 3],
      maxBlocks: 8,
      buggy: ["F", "F", "F", "L", "F"],
    },
  },
  {
    id: "treasure-map",
    title: "Treasure Map Coder",
    ages: [5, 10],
    minutes: 10,
    materials: ["paper", "crayons", "a small toy"],
    steps: [
      "Draw a 4×4 grid map together and hide the toy treasure in one square.",
      "The child writes the route as arrows: → → ↓ …",
      "You walk it. If you miss, the route has a bug — debug it together.",
      "Add a rule: 'if you meet the sofa monster, go around' (selection!).",
    ],
    ask: ["How many steps?", "Is there a shorter route?", "What does the arrow rule mean?"],
    learned: "Sequencing, debugging, and if-rules — the core of algorithms.",
    robot: {
      id: "robot-treasure",
      title: "Arrow-route to the treasure",
      size: 4,
      start: [0, 3],
      dir: 0,
      goal: [3, 0],
      maxBlocks: 9,
    },
  },
  {
    id: "pattern-parrots",
    title: "Pattern Parrots",
    ages: [4, 8],
    minutes: 10,
    materials: ["coloured blocks, beads or fruit"],
    steps: [
      "Lay a pattern: red, blue, red, blue… Ask what comes next.",
      "Make trickier ones: red, red, blue, red, red, blue…",
      "Child invents a pattern with a secret rule; you guess the rule.",
      "Sort the pile by the rule: 'all reds here, all blues there' (sorting!).",
    ],
    ask: ["What is the rule?", "What breaks the pattern?", "Can you make a rule for me?"],
    learned: "Pattern recognition and sorting — how computers spot structure.",
  },
  {
    id: "cup-stack-sort",
    title: "Cup-Stack Sorting Race",
    ages: [6, 12],
    minutes: 15,
    materials: ["6 paper cups", "a marker", "a timer"],
    steps: [
      "Number the cups 1–6, shuffle them, line them up.",
      "Rule: you may only swap NEIGHBOURING cups (bubble-sort rules!).",
      "Time how long it takes to get 1-2-3-4-5-6.",
      "Try a new strategy: find the smallest cup and bring it to the front (selection sort). Which was faster?",
    ],
    ask: ["How many swaps did that take?", "Which plan was faster?", "What if there were 100 cups?"],
    learned: "Sorting strategies and why efficiency matters.",
  },
  {
    id: "secret-codes",
    title: "Secret Dinner Codes",
    ages: [6, 12],
    minutes: 10,
    materials: ["paper", "pencil"],
    steps: [
      "Invent a code: A=•−, B=−•• … or simpler: A=1, B=2, C=3.",
      "Write tonight's dinner menu in code. Child decodes it.",
      "Try binary: use only • and − (or 0 and 1) for 4 letters.",
      "Child encodes a secret message back to you.",
    ],
    ask: ["Why do computers use only 0 and 1?", "What happens if one dot is wrong?"],
    learned: "Data representation — the idea behind binary.",
  },
  {
    id: "debug-dance",
    title: "Debug Dance",
    ages: [4, 9],
    minutes: 10,
    materials: ["music", "space to move"],
    steps: [
      "Choreograph a 4-move dance: clap, stomp, spin, jump. That is your program.",
      "Perform it. Now 'plant a bug': swap two moves on purpose.",
      "Child watches and shouts BUG when the wrong move happens.",
      "Fix the bug and perform the clean version. Add a repeat: 'do the chorus twice' (loops!).",
    ],
    ask: ["Where exactly was the bug?", "How did you know?", "What does 'repeat' save us?"],
    learned: "Testing, debugging and loops through movement.",
  },
];

export function pickActivity(age: number, minutes: number): Activity {
  const fits = ACTIVITIES.filter((a) => age >= a.ages[0] && age <= a.ages[1]);
  const pool = fits.length ? fits : ACTIVITIES;
  const quick = pool.filter((a) => a.minutes <= minutes);
  const final = quick.length ? quick : pool;
  return final[Math.floor(Math.random() * final.length)];
}
