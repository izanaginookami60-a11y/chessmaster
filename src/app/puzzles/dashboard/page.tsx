"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FiTarget, FiTrendingUp, FiAward, FiClock } from "react-icons/fi";
import {
  PageHeader,
  EmptyState,
  SectionTitle,
} from "@/components/ui/PageHeader";
import { Spinner } from "@/components/ui/Spinner";
import { useAuth } from "@/lib/hooks/useAuth";
import {
  BUNDLED_PUZZLES,
  fetchPuzzleProgress,
  type PuzzleProgress,
} from "@/lib/puzzles";
import { readPuzzleStats, type PuzzleStats } from "@/lib/firebase/users";

export default function PuzzleDashboardPage() {
  const { firebaseUser, profile, isAuthenticated, isLoading } = useAuth();
  const [progress, setProgress] = useState<PuzzleProgress[] | null>(null);
  const [stats, setStats] = useState<PuzzleStats>({});

  const uid = isAuthenticated && firebaseUser ? firebaseUser.uid : null;

  useEffect(() => {
    if (!uid) return;
    let cancelled = false;

    Promise.all([fetchPuzzleProgress(uid), readPuzzleStats(uid)])
      .then(([progressRows, puzzleStats]) => {
        if (cancelled) return;
        setProgress(progressRows);
        setStats(puzzleStats);
      })
      .catch(() => {
        if (!cancelled) setProgress([]);
      });

    return () => {
      cancelled = true;
    };
  }, [uid]);

  const solvedCount = (progress ?? []).filter((row) => row.solved).length;
  const totalPuzzles = BUNDLED_PUZZLES.length;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <PageHeader
        title="Puzzle progress"
        description="Your tactics rating, best rush and how much of the set you have solved."
        actions={
          <Link
            href="/puzzles/rush"
            className="text-xs font-medium text-accent-link"
          >
            Train now
          </Link>
        }
      />

      {!uid ? (
        <EmptyState
          title={isLoading ? "Loading…" : "Log in to track your puzzles"}
          description={
            isLoading
              ? undefined
              : "Solved puzzles, your rating and your best rush score are saved to your account."
          }
          action={
            !isLoading ? (
              <Link
                href="/login?redirect=/puzzles/dashboard"
                className="inline-block bg-accent-primary text-bg-primary font-semibold px-4 py-2 rounded-lg"
              >
                Log in
              </Link>
            ) : undefined
          }
        />
      ) : progress === null ? (
        <Spinner label="Loading your progress…" />
      ) : (
        <>
          <section className="grid sm:grid-cols-4 gap-3 mb-8">
            <div className="bg-bg-secondary rounded-xl p-4">
              <FiTrendingUp size={16} className="text-accent-primary mb-2" />
              <p className="text-xs text-text-secondary">Puzzle rating</p>
              <p className="text-2xl font-bold text-text-primary">
                {profile?.ratingPuzzle ?? 1200}
              </p>
            </div>
            <div className="bg-bg-secondary rounded-xl p-4">
              <FiTarget size={16} className="text-accent-primary mb-2" />
              <p className="text-xs text-text-secondary">Solved here</p>
              <p className="text-2xl font-bold text-text-primary">
                {solvedCount}/{totalPuzzles}
              </p>
            </div>
            <div className="bg-bg-secondary rounded-xl p-4">
              <FiAward size={16} className="text-accent-primary mb-2" />
              <p className="text-xs text-text-secondary">Best rush</p>
              <p className="text-2xl font-bold text-text-primary">
                {stats.bestRushScore ?? 0}
              </p>
            </div>
            <div className="bg-bg-secondary rounded-xl p-4">
              <FiClock size={16} className="text-accent-primary mb-2" />
              <p className="text-xs text-text-secondary">Last played</p>
              <p className="text-sm font-semibold text-text-primary">
                {stats.lastPlayedAt
                  ? new Date(stats.lastPlayedAt).toLocaleDateString()
                  : "—"}
              </p>
            </div>
          </section>

          <section>
            <SectionTitle>Recent attempts</SectionTitle>
            {progress.length === 0 ? (
              <EmptyState
                title="No attempts yet"
                description="Solve the daily puzzle to get started."
                action={
                  <Link
                    href="/puzzles/daily"
                    className="inline-block bg-accent-primary text-bg-primary font-semibold px-4 py-2 rounded-lg"
                  >
                    Puzzle of the day
                  </Link>
                }
              />
            ) : (
              <ul className="space-y-2">
                {progress.slice(0, 12).map((row, index) => (
                  <li
                    key={index}
                    className="flex items-center gap-3 bg-bg-secondary rounded-lg px-4 py-2.5 text-sm"
                  >
                    <span
                      className={`text-xs font-bold px-2 py-1 rounded uppercase ${
                        row.solved
                          ? "bg-result-win/20 text-result-win"
                          : "bg-result-loss/20 text-result-loss"
                      }`}
                    >
                      {row.solved ? "solved" : "missed"}
                    </span>
                    <span className="text-text-secondary">
                      {row.attempts} attempt{row.attempts === 1 ? "" : "s"}
                    </span>
                    {row.bestTimeMs && (
                      <span className="text-text-muted text-xs">
                        best {Math.round(row.bestTimeMs / 1000)}s
                      </span>
                    )}
                    <span className="ml-auto text-xs text-text-muted">
                      {row.lastAttemptAt
                        ? new Date(row.lastAttemptAt).toLocaleDateString()
                        : ""}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

        </>
      )}
    </div>
  );
}
