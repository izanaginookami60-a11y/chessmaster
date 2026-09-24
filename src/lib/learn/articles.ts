export interface Article {
  id: string;
  title: string;
  excerpt: string;
  minutes: number;
  tags: string[];
  /** Paragraphs; a line starting with "## " becomes a heading. */
  body: string[];
}

export const ARTICLES: Article[] = [
  {
    id: "how-to-calculate",
    title: "How to calculate like a stronger player",
    excerpt:
      "A repeatable checklist for spotting tactics: checks, captures, threats — in that order.",
    minutes: 6,
    tags: ["tactics", "improvement"],
    body: [
      "## Start with forcing moves",
      "Before looking at anything else, list every check, every capture and every threat you can make. Forcing moves shrink the opponent's options, which makes the tree you have to calculate much smaller.",
      "## Look for undefended pieces",
      "Half of all club-level tactics start with a piece that nobody is defending. Scan the board for them every move — yours and theirs. An undefended piece plus a checking move is a fork waiting to happen.",
      "## Count the defenders",
      "A capture is only good if you come out ahead after the recaptures settle. Count attackers and defenders on the target square, then count material a couple of moves deep. If you cannot see the end of the sequence, look for a safer move.",
      "## Finish the check",
      "When you find a good idea, do not play it yet: look for a stronger one first. Then, once you are sure, take the time to see your opponent's best reply. Most blunders at every level come from stopping the analysis one move too early.",
    ],
  },
  {
    id: "time-management",
    title: "Managing the clock in blitz and rapid",
    excerpt:
      "Knowing when to think and when to move by instinct is a skill in itself.",
    minutes: 5,
    tags: ["strategy", "psychology"],
    body: [
      "## Budget your time",
      "Divide your time by the number of moves you expect to play. In a 10-minute game with 40 moves ahead, that is roughly 15 seconds per move — spend more on the critical ones and much less on obvious ones.",
      "## Move quickly through the opening",
      "If you know your opening, play it fast and bank the time. If you do not, play principled moves rather than burning three minutes looking for perfection.",
      "## Slow down when the position changes",
      "After every capture, trade or pawn break, take a moment to rebuild your picture of the board. These transitions are where most blitz games are decided.",
      "## Do not flag in a winning position",
      "When you are winning, simplify and check your clock every move. Converting with 10 seconds left is how good games turn into losses.",
    ],
  },
  {
    id: "analysing-your-games",
    title: "How to analyse your own games",
    excerpt:
      "Using the analysis board to turn a loss into a lesson you actually remember.",
    minutes: 7,
    tags: ["improvement", "analysis"],
    body: [
      "## Write down your thoughts first",
      "Before you run the engine, go through the game and note the three moments you felt unsure. Guessing wrong and then seeing why is far more memorable than passively reading engine lines.",
      "## Compare with the engine",
      "Open the game in the analysis board and step through it. When your move differs from the engine's, ask what the engine's move was doing that yours was not: a threat, a defended piece, a faster king.",
      "## Classify your mistakes",
      "Sort every mistake into one of three buckets: tactics (you missed a forcing move), time (you rushed), or plans (you had no idea what to do). Each bucket needs different training.",
      "## Keep a list",
      "Write the pattern that beat you at the top of your notes — hanging pieces, back rank, knight forks. If the same pattern shows up three games in a row, that is your next study topic.",
    ],
  },
];

export function getArticleById(id: string): Article | undefined {
  return ARTICLES.find((article) => article.id === id);
}
