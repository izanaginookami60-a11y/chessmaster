"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { FiZap, FiX, FiRotateCcw } from "react-icons/fi";
import { PageHeader } from "@/components/ui/PageHeader";
import { Spinner } from "@/components/ui/Spinner";
import { PuzzleBoard } from "@/components/puzzles/PuzzleBoard";
import { useAuth } from "@/lib/hooks/useAuth";
import {
  BUNDLED_PUZZLES,
  getPuzzleById,
  getRushSet,
  pickPuzzleForRating,
  puzzleRatingDelta,
  savePuzzleProgress,
  THEME_LABELS,
  type Puzzle,
} from "@/lib/puzzles";
import { recordPuzzleResult, savePuzzleStats } from "@/lib/firebase/users";

const RUSH_SECONDS = 180;
const MAX_STRIKES = 3;

export default function PuzzleRushPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-4xl mx-auto px-4 py-12">
          <Spinner label="Loading puzzles…" />
        </div>
      }
    >
      <PuzzleRush />
    </Suspense>
  );
}

function PuzzleRush() {
  const searchParams = useSearchParams();
  const { firebaseUser, profile, isAuthenticated } = useAuth();
  const soloId = searchParams.get("solo");
  const theme = searchParams.get("theme");

  const soloPuzzle = soloId ? getPuzzleById(soloId) ?? null : null;
  const [queue, setQueue] = useState<Puzzle[]>(() => getRushSet(40));
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [strikes, setStrikes] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(RUSH_SECONDS);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [delta, setDelta] = useState(0);
  const [solvedIds, setSolvedIds] = useState<string[]>([]);
  const startedRef = useRef<number>(0);
  const savedRef = useRef(false);

  const uid = isAuthenticated && firebaseUser ? firebaseUser.uid : null;

  // Theme drills and single-puzzle practice are derived, so switching
  // mode never needs an effect to resync state.
  const activeQueue = useMemo(() => {
    if (soloPuzzle) return [soloPuzzle];
    if (theme) {
      const themed = BUNDLED_PUZZLES.filter((entry) =>
        (entry.themes as string[]).includes(theme)
      );
      if (themed.length > 0) return themed;
    }
    return queue;
  }, [soloPuzzle, theme, queue]);

  // Countdown timer (state updates happen inside the interval callback).
  useEffect(() => {
    if (!running || finished) return;
    const id = setInterval(() => {
      setSecondsLeft((current) => {
        if (current <= 1) {
          setRunning(false);
          setFinished(true);
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running, finished]);

  const puzzle =
    activeQueue[index % Math.max(1, activeQueue.length)] ?? BUNDLED_PUZZLES[0];

  const headline = useMemo(() => {
    if (soloPuzzle) return "Practice puzzle";
    if (theme) return `Drill: ${THEME_LABELS[theme as never] ?? theme}`;
    return "Puzzle rush";
  }, [soloPuzzle, theme]);

  function start() {
    startedRef.current = Date.now();
    savedRef.current = false;
    setScore(0);
    setStrikes(0);
    setSecondsLeft(RUSH_SECONDS);
    setFinished(false);
    setRunning(true);
    setIndex(0);
    setDelta(0);
    setSolvedIds([]);
    setQueue(getRushSet(40));
  }

  async function persistRush(finalScore: number, ratingDelta: number) {
    if (!uid || savedRef.current) return;
    savedRef.current = true;
    try {
      await recordPuzzleResult({
        uid,
        delta: ratingDelta,
        solved: finalScore > 0,
        secondsTaken: RUSH_SECONDS - secondsLeft,
        totalSolved: finalScore > 0,
      });
      await savePuzzleStats(uid, { bestRushScore: finalScore });
    } catch {
      // Best effort — progress saving never blocks the puzzle loop.
    }
  }

  async function handleSolved() {
    const seconds = Math.round((Date.now() - startedRef.current) / 1000);
    const playerRating = profile?.ratingPuzzle ?? 1200;
    const change = puzzleRatingDelta(playerRating, puzzle.rating, true, seconds);

    const nextScore = score + 1;
    const nextDelta = delta + change;
    setScore(nextScore);
    setDelta(nextDelta);
    setSolvedIds((ids) => [...ids, puzzle.id]);

    if (uid) {
      void savePuzzleProgress(uid, puzzle.id, {
        solved: true,
        attempts: 1,
        bestTimeMs: seconds * 1000,
        lastAttemptAt: new Date().toISOString(),
      }).catch(() => undefined);
    }

    if (soloPuzzle) {
      setFinished(true);
      setRunning(false);
      await persistRush(nextScore, nextDelta);
      return;
    }

    // Keep the run going with a fresh puzzle near the player's level.
    const next = pickPuzzleForRating(playerRating + nextDelta, solvedIds);
    setQueue((current) => [...current, next]);
    setIndex((current) => current + 1);
  }

  function handleWrong() {
    const playerRating = profile?.ratingPuzzle ?? 1200;

    if (soloPuzzle) {
      const change = puzzleRatingDelta(playerRating, puzzle.rating, false);
      const nextDelta = delta + change;
      setDelta(nextDelta);
      setFinished(true);
      setRunning(false);
      void persistRush(score, nextDelta);
      return;
    }

    const nextStrikes = strikes + 1;
    setStrikes(nextStrikes);
    toast.error(`Wrong move (${nextStrikes}/${MAX_STRIKES})`);

    if (nextStrikes >= MAX_STRIKES) {
      const change = puzzleRatingDelta(playerRating, puzzle.rating, false);
      const nextDelta = delta + change;
      setDelta(nextDelta);
      setRunning(false);
      setFinished(true);
      void persistRush(score, nextDelta);
      return;
    }

    // Serve a fresh puzzle rather than hanging on the missed one.
    setIndex((current) => current + 1);
  }

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <PageHeader
        title={headline}
        description={
          soloPuzzle
            ? soloPuzzle.title
            : "3 minutes, three strikes — solve as many as you can."
        }
        actions={
          <Link href="/puzzles" className="text-xs font-medium text-accent-link">
            All puzzles
          </Link>
        }
      />

      <div className="flex flex-wrap items-center gap-4 mb-5 text-sm">
        <span className="inline-flex items-center gap-1.5 font-mono text-lg text-text-primary">
          <FiZap size={16} className="text-accent-secondary" />
          {minutes}:{String(seconds).padStart(2, "0")}
        </span>
        <span className="text-text-secondary">
          Solved <span className="font-semibold text-text-primary">{score}</span>
        </span>
        {!soloPuzzle && (
          <span className="flex items-center gap-1 text-text-secondary">
            Strikes
            {Array.from({ length: MAX_STRIKES }).map((_, i) => (
              <FiX
                key={i}
                size={14}
                className={i < strikes ? "text-result-loss" : "text-text-muted"}
              />
            ))}
          </span>
        )}
        {delta !== 0 && (
          <span className="text-xs text-accent-primary">
            rating {delta >= 0 ? "+" : ""}
            {delta}
          </span>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div>
          <PuzzleBoard
            key={`${puzzle.id}-${index}`}
            puzzle={puzzle}
            locked={finished}
            onSolved={() => void handleSolved()}
            onWrongMove={handleWrong}
          />

          {!running && !finished && (
            <button
              onClick={start}
              className="mt-3 inline-flex items-center gap-2 bg-accent-primary text-bg-primary font-semibold px-4 py-2 rounded-lg"
            >
              <FiZap size={15} /> {soloPuzzle ? "Solve again" : "Start rush"}
            </button>
          )}
        </div>

        <div className="flex-1 min-w-0">
          {finished ? (
            <div className="bg-bg-secondary rounded-xl p-5">
              <p className="font-semibold text-text-primary mb-1">
                {soloPuzzle ? "Puzzle finished" : "Rush over"}
              </p>
              <p className="text-sm text-text-secondary mb-3">
                {score} solved · {strikes} strike{strikes === 1 ? "" : "s"} ·
                rating {delta >= 0 ? "+" : ""}
                {delta}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={start}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold bg-accent-primary text-bg-primary px-3 py-2 rounded-lg"
                >
                  <FiRotateCcw size={13} /> Play again
                </button>
                <Link
                  href="/puzzles/dashboard"
                  className="text-xs font-medium bg-bg-primary hover:bg-bg-hover text-text-primary px-3 py-2 rounded-lg"
                >
                  See progress
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-bg-secondary rounded-xl p-5 text-sm text-text-secondary">
              <p className="font-semibold text-text-primary mb-2">
                {puzzle.title}
              </p>
              <p>
                {puzzle.type === "mate"
                  ? "Mate in one."
                  : "Win material with the best move."}
              </p>
              <p className="text-xs text-text-muted mt-2">
                Difficulty {puzzle.rating} ·{" "}
                {puzzle.themes
                  .map((entry) => THEME_LABELS[entry] ?? entry)
                  .join(" · ")}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
