"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FiAward, FiUser } from "react-icons/fi";
import { PageHeader, EmptyState } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { fetchLeaderboard } from "@/lib/firebase/games";
import type { PublicProfile } from "@/types/user";

const BOARDS = [
  { id: "rating", label: "Overall" },
  { id: "ratingBullet", label: "Bullet" },
  { id: "ratingBlitz", label: "Blitz" },
  { id: "ratingRapid", label: "Rapid" },
  { id: "ratingPuzzle", label: "Puzzles" },
] as const;

type BoardId = (typeof BOARDS)[number]["id"];

export default function LeaderboardPage() {
  const [board, setBoard] = useState<BoardId>("rating");
  const [players, setPlayers] = useState<PublicProfile[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetchLeaderboard(50)
      .then((rows) => {
        if (!cancelled) setPlayers(rows);
      })
      .catch(() => {
        if (!cancelled) {
          setPlayers([]);
          setError(
            "The leaderboard is empty or needs the Firestore indexes from firestore.indexes.json."
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const ranked = (players ?? [])
    .filter((player) => typeof player[board] === "number")
    .sort((a, b) => Number(b[board]) - Number(a[board]));

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <PageHeader
        title="Leaderboard"
        description="The strongest players on ChessMaster, updated as games finish."
      />

      <div className="flex flex-wrap gap-2 mb-5">
        {BOARDS.map((entry) => (
          <button
            key={entry.id}
            onClick={() => setBoard(entry.id)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
              board === entry.id
                ? "bg-accent-primary text-bg-primary"
                : "bg-bg-secondary text-text-secondary hover:text-text-primary"
            }`}
          >
            {entry.label}
          </button>
        ))}
      </div>

      {players === null ? (
        <div className="space-y-2">
          <Skeleton className="h-14" />
          <Skeleton className="h-14" />
          <Skeleton className="h-14" />
        </div>
      ) : ranked.length === 0 ? (
        <EmptyState
          title={error ?? "No rated players yet"}
          description={
            error ? undefined : "Play a rated game to appear on the board."
          }
          action={
            <Link
              href="/play/online"
              className="inline-block bg-accent-primary text-bg-primary font-semibold px-4 py-2 rounded-lg"
            >
              Play rated
            </Link>
          }
        />
      ) : (
        <ol className="space-y-2">
          {ranked.map((player, index) => (
            <li
              key={player.uid}
              className="flex items-center gap-3 bg-bg-secondary rounded-xl px-4 py-3"
            >
              <span
                className={`w-7 text-center font-bold ${
                  index === 0
                    ? "text-accent-secondary"
                    : index < 3
                    ? "text-text-primary"
                    : "text-text-muted"
                }`}
              >
                {index + 1}
              </span>

              <div className="w-9 h-9 rounded-full bg-bg-hover text-text-primary font-bold flex items-center justify-center shrink-0">
                {player.username?.charAt(0).toUpperCase() ?? (
                  <FiUser size={14} />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <Link
                  href={`/profile/${player.username}`}
                  className="text-sm font-medium text-text-primary hover:text-accent-link truncate block"
                >
                  {player.username}
                </Link>
                <p className="text-xs text-text-secondary">
                  {player.stats?.gamesPlayed ?? 0} games ·{" "}
                  {player.stats?.wins ?? 0} wins
                </p>
              </div>

              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent-primary">
                <FiAward size={13} />
                {Number(player[board])}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
