export interface BotDefinition {
  id: string;
  level: number; // 1-10
  name: string;
  elo: number;
  personality: string;
  style: string;
  avatarColor: string;
  skillLevel: number; // Stockfish "Skill Level" UCI option, 0-20
  depth: number; // search depth cap
  moveTimeMs: number; // soft time budget per move
  blunderChance: number; // 0-1, chance to play a random legal move instead
}

export const BOTS: BotDefinition[] = [
  {
    id: "martin",
    level: 1,
    name: "Martin",
    elo: 250,
    personality: "Friendly beginner who's still learning the ropes.",
    style: "Random, unpredictable moves",
    avatarColor: "#81B64C",
    skillLevel: 0,
    depth: 1,
    moveTimeMs: 200,
    blunderChance: 0.6,
  },
  {
    id: "antonio",
    level: 2,
    name: "Antonio",
    elo: 400,
    personality: "Getting the hang of things, but still shaky.",
    style: "Spots obvious one-move threats",
    avatarColor: "#E5A249",
    skillLevel: 2,
    depth: 2,
    moveTimeMs: 250,
    blunderChance: 0.45,
  },
  {
    id: "akira",
    level: 3,
    name: "Akira",
    elo: 650,
    personality: "Knows the basics and a few opening tricks.",
    style: "Simple tactics, occasional blunders",
    avatarColor: "#6BA4D9",
    skillLevel: 4,
    depth: 3,
    moveTimeMs: 300,
    blunderChance: 0.32,
  },
  {
    id: "clara",
    level: 4,
    name: "Clara",
    elo: 850,
    personality: "A decent club player who plays it fairly safe.",
    style: "Solid, occasionally cautious",
    avatarColor: "#A855F7",
    skillLevel: 6,
    depth: 4,
    moveTimeMs: 350,
    blunderChance: 0.22,
  },
  {
    id: "farid",
    level: 5,
    name: "Farid",
    elo: 1100,
    personality: "A reliable intermediate opponent.",
    style: "Balanced, punishes clear mistakes",
    avatarColor: "#F97316",
    skillLevel: 8,
    depth: 6,
    moveTimeMs: 450,
    blunderChance: 0.14,
  },
  {
    id: "isabel",
    level: 6,
    name: "Isabel",
    elo: 1350,
    personality: "Strong intermediate with sharp calculation.",
    style: "Tactical and aggressive",
    avatarColor: "#FA412D",
    skillLevel: 10,
    depth: 8,
    moveTimeMs: 550,
    blunderChance: 0.08,
  },
  {
    id: "viktor",
    level: 7,
    name: "Viktor",
    elo: 1600,
    personality: "An advanced player with real positional understanding.",
    style: "Positional, patient",
    avatarColor: "#22C55E",
    skillLevel: 13,
    depth: 10,
    moveTimeMs: 700,
    blunderChance: 0.04,
  },
  {
    id: "elena",
    level: 8,
    name: "Elena",
    elo: 1850,
    personality: "Expert-level player who rarely misses a tactic.",
    style: "Precise, tricky in complications",
    avatarColor: "#3B82F6",
    skillLevel: 16,
    depth: 12,
    moveTimeMs: 900,
    blunderChance: 0.015,
  },
  {
    id: "magnus-bot",
    level: 9,
    name: "Magnus-Bot",
    elo: 2100,
    personality: "Master-level strength — very few weaknesses.",
    style: "Deep calculation, near-flawless",
    avatarColor: "#EAB308",
    skillLevel: 19,
    depth: 15,
    moveTimeMs: 1200,
    blunderChance: 0.005,
  },
  {
    id: "stockfish",
    level: 10,
    name: "Stockfish",
    elo: 2500,
    personality: "Maximum engine strength. No mercy.",
    style: "Perfect calculation",
    avatarColor: "#312E2B",
    skillLevel: 20,
    depth: 18,
    moveTimeMs: 1800,
    blunderChance: 0,
  },
];

export function getBotById(id: string): BotDefinition | undefined {
  return BOTS.find((b) => b.id === id);
}
