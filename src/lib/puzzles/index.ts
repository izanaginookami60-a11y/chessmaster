"use client";

import { collection, doc, getDocs, limit, query, serverTimestamp, setDoc } from "firebase/firestore";
import { firestore } from "@/lib/firebase/config";
import { randomChance } from "@/lib/utils/random";
import puzzlesJson from "./puzzles.json";

export type PuzzleTheme =
  | "mateIn1"
  | "winMaterial"
  | "backRank"
  | "fork"
  | "smothered"
  | "attack"
  | "knight"
  | "queen"
  | "rook";

export interface Puzzle {
  id: string;
  title: string;
  fen: string;
  /** Solution in UCI, alternating solver/opponent moves. */
  moves: string[];
  rating: number;
  themes: PuzzleTheme[];
  type: "mate" | "material";
}

/** Shipped with the app so puzzles work before any seeding is done. */
export const BUNDLED_PUZZLES = puzzlesJson as unknown as Puzzle[];

export const THEME_LABELS: Record<PuzzleTheme, string> = {
  mateIn1: "Mate in one",
  winMaterial: "Win material",
  backRank: "Back-rank",
  fork: "Forks",
  smothered: "Smothered mate",
  attack: "Attack",
  knight: "Knights",
  queen: "Queens",
  rook: "Rooks",
};

export function getPuzzleById(id: string): Puzzle | undefined {
  return BUNDLED_PUZZLES.find((puzzle) => puzzle.id === id);
}

/** Deterministic "puzzle of the day" — same for everyone, changes daily. */
export function getDailyPuzzle(date: Date = new Date()): Puzzle {
  const key = `${date.getUTCFullYear()}-${date.getUTCMonth() + 1}-${date.getUTCDate()}`;
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) % 100000;
  }
  return BUNDLED_PUZZLES[hash % BUNDLED_PUZZLES.length];
}

/** Warm-up set ordered from easiest upward for Puzzle Rush. */
export function getRushSet(count = 30): Puzzle[] {
  const sorted = [...BUNDLED_PUZZLES].sort((a, b) => a.rating - b.rating);
  const set: Puzzle[] = [];
  while (set.length < count) {
    for (const puzzle of sorted) {
      if (set.length >= count) break;
      set.push(puzzle);
    }
  }
  return set;
}

/**
 * Puzzle rating change: an Elo-style update against the puzzle's rating,
 * with a speed bonus so quick solves gain more.
 */
export function puzzleRatingDelta(
  playerRating: number,
  puzzleRating: number,
  solved: boolean,
  secondsTaken = 0
): number {
  const expected =
    1 / (1 + Math.pow(10, (puzzleRating - playerRating) / 400));
  const k = 24;
  const score = solved ? 1 : 0;
  const raw = k * (score - expected);
  const speedBonus = solved && secondsTaken > 0 && secondsTaken < 10 ? 4 : 0;
  const delta = Math.round(raw + speedBonus);
  return solved ? Math.max(1, delta) : Math.min(-1, delta);
}

export interface PuzzleProgress {
  solved: boolean;
  attempts: number;
  bestTimeMs: number | null;
  lastAttemptAt: string;
}

/** Attempts/solutions stored per user in users/{uid}/puzzleProgress. */
export async function savePuzzleProgress(
  uid: string,
  puzzleId: string,
  progress: PuzzleProgress
): Promise<void> {
  await setDoc(
    doc(firestore, "users", uid, "puzzleProgress", puzzleId),
    { ...progress, updatedAt: serverTimestamp() },
    { merge: true }
  );
}

export async function fetchPuzzleProgress(
  uid: string
): Promise<PuzzleProgress[]> {
  const snap = await getDocs(
    collection(firestore, "users", uid, "puzzleProgress")
  );
  return snap.docs.map((docSnap) => docSnap.data() as PuzzleProgress);
}

/**
 * Puzzles live in Firestore (read-only, seeded server-side). If the
 * collection is empty or unreadable we fall back to the bundled set.
 */
export async function fetchPuzzles(max = 50): Promise<Puzzle[]> {
  try {
    const snap = await getDocs(
      query(collection(firestore, "puzzles"), limit(max))
    );
    if (snap.empty) return BUNDLED_PUZZLES;
    return snap.docs.map((docSnap) => ({
      ...(docSnap.data() as Puzzle),
      id: docSnap.id,
    }));
  } catch {
    return BUNDLED_PUZZLES;
  }
}

/** Occasionally offer an easier/harder puzzle to keep streaks fair. */
export function pickPuzzleForRating(
  rating: number,
  excludeIds: string[] = []
): Puzzle {
  const pool = BUNDLED_PUZZLES.filter((p) => !excludeIds.includes(p.id));
  const candidates = pool.length > 0 ? pool : BUNDLED_PUZZLES;

  const close = candidates.filter(
    (puzzle) => Math.abs(puzzle.rating - rating) <= 200
  );
  if (close.length === 0) return candidates[0];

  // Mostly stick to your level, sometimes serve a slightly harder one.
  if (randomChance(0.25)) return candidates[candidates.length - 1];
  return close[0];
}
