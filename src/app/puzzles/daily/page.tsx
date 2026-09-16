"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { FiSun, FiEye, FiCheck } from "react-icons/fi";
import { PageHeader } from "@/components/ui/PageHeader";
import { PuzzleBoard } from "@/components/puzzles/PuzzleBoard";
import { useAuth } from "@/lib/hooks/useAuth";
import {
  getDailyPuzzle,
  puzzleRatingDelta,
  savePuzzleProgress,
  THEME_LABELS,
} from "@/lib/puzzles";
import { recordPuzzleResult } from "@/lib/firebase/users";

export default function DailyPuzzlePage() {
  const { firebaseUser, profile, isAuthenticated } = useAuth();
  const puzzle = useMemo(() => getDailyPuzzle(), []);
  const [attempts, setAttempts] = useState(1);
  const [solved, setSolved] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [delta, setDelta] = useState<number | null>(null);
  const [startedAt] = useState(() => Date.now());

  const uid = isAuthenticated && firebaseUser ? firebaseUser.uid : null;

  async function handleSolved() {
    if (solved) return;
    setSolved(true);

    const seconds = Math.round((Date.now() - startedAt) / 1000);
    const playerRating = profile?.ratingPuzzle ?? 1200;
    const change = puzzleRatingDelta(
      playerRating,
      puzzle.rating,
      attempts === 1,
      seconds
    );
    setDelta(change);
    toast.success(`Solved! ${change >= 0 ? "+" : ""}${change} puzzle rating`);

    if (!uid) return;
    try {
      await savePuzzleProgress(uid, puzzle.id, {
        solved: true,
        attempts,
        bestTimeMs: seconds * 1000,
        lastAttemptAt: new Date().toISOString(),
      });
      await recordPuzzleResult({
        uid,
        delta: change,
        solved: true,
        secondsTaken: seconds,
        totalSolved: attempts === 1,
      });
    } catch {
      // Progress saving is best-effort.
    }
  }

  function handleWrong() {
    setAttempts((count) => count + 1);
    toast.error("Not the move — try again.");
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <PageHeader
        title="Puzzle of the day"
        description={`${puzzle.title} · ${puzzle.themes
          .map((theme) => THEME_LABELS[theme] ?? theme)
          .join(" · ")}`}
        actions={
          <Link
            href="/puzzles/rush"
            className="text-xs font-medium text-accent-link"
          >
            Puzzle rush
          </Link>
        }
      />

      <div className="flex flex-col lg:flex-row gap-6">
        <PuzzleBoard
          puzzle={puzzle}
          locked={revealed}
          onSolved={() => void handleSolved()}
          onWrongMove={handleWrong}
        />

        <div className="flex-1 min-w-0 space-y-3">
          <div className="bg-bg-secondary rounded-xl p-4 text-sm">
            <p className="flex items-center gap-2 font-semibold text-text-primary mb-2">
              <FiSun size={15} className="text-accent-secondary" /> Today&apos;s
              puzzle
            </p>
            <p className="text-text-secondary">
              {puzzle.type === "mate"
                ? "Deliver checkmate in one move."
                : "The best move wins material."}
            </p>
            <p className="text-xs text-text-muted mt-2">
              Difficulty {puzzle.rating} · attempts {attempts}
            </p>
            {delta !== null && (
              <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-accent-primary">
                <FiCheck size={13} /> Rating {delta >= 0 ? "+" : ""}
                {delta} (solved {attempts === 1 ? "first try" : "after retries"})
              </p>
            )}
          </div>

          {!solved && !revealed && (
            <button
              onClick={() => setRevealed(true)}
              className="inline-flex items-center gap-1.5 text-xs font-medium bg-bg-secondary hover:bg-bg-hover text-text-primary px-3 py-2 rounded-lg"
            >
              <FiEye size={13} /> Show the solution
            </button>
          )}

          {revealed && (
            <p className="text-xs text-text-secondary bg-bg-secondary rounded-lg px-3 py-2">
              Solution revealed — come back tomorrow for a fresh one.
            </p>
          )}

          {!isAuthenticated && (
            <p className="text-xs text-text-secondary">
              <Link
                href="/login?redirect=/puzzles/daily"
                className="text-accent-link"
              >
                Log in
              </Link>{" "}
              to keep your streak and rating.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
