"use client";

import {
  doc,
  getDoc,
  increment,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { firestore } from "./config";
import type { UserProfile } from "@/types/user";

/** Update the signed-in user's own profile document. */
export async function updateOwnProfile(
  uid: string,
  data: Partial<UserProfile> & Record<string, unknown>
): Promise<void> {
  await updateDoc(doc(firestore, "users", uid), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export interface PuzzleResultInput {
  uid: string;
  delta: number;
  solved: boolean;
  secondsTaken: number;
  totalSolved: boolean; // first time this puzzle has ever been solved
}

/**
 * Apply the puzzle rating change and keep the aggregate counters going.
 * Puzzle progress is single-player, so the client is allowed to write
 * these fields (see firestore.rules) — the trade-off is documented in
 * the README.
 */
export async function recordPuzzleResult({
  uid,
  delta,
  solved,
  secondsTaken,
  totalSolved,
}: PuzzleResultInput): Promise<void> {
  await setDoc(
    doc(firestore, "users", uid),
    {
      ratingPuzzle: increment(delta),
      "puzzleStats.attempts": increment(1),
      "puzzleStats.solved": increment(solved ? 1 : 0),
      "puzzleStats.firstTimeSolves": increment(totalSolved ? 1 : 0),
      "puzzleStats.fastestSolveMs": solved
        ? Math.round(secondsTaken * 1000)
        : 0,
      "puzzleStats.lastPlayedAt": new Date().toISOString(),
    },
    { merge: true }
  );
}

/** Puzzle counters used by the dashboard. */
export interface PuzzleStats {
  attempts?: number;
  solved?: number;
  firstTimeSolves?: number;
  fastestSolveMs?: number;
  lastPlayedAt?: string;
  streak?: number;
  bestRushScore?: number;
}

export async function readPuzzleStats(uid: string): Promise<PuzzleStats> {
  const snap = await getDoc(doc(firestore, "users", uid));
  const data = snap.data() as { puzzleStats?: PuzzleStats } | undefined;
  return data?.puzzleStats ?? {};
}

export async function savePuzzleStats(
  uid: string,
  stats: Partial<PuzzleStats>
): Promise<void> {
  const payload: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(stats)) {
    payload[`puzzleStats.${key}`] = value;
  }
  await updateDoc(doc(firestore, "users", uid), payload);
}
