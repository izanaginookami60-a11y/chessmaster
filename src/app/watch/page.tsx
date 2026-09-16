"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FiUsers, FiClock } from "react-icons/fi";
import { PageHeader, EmptyState } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/lib/hooks/useAuth";
import { subscribeActiveGames, type LiveGame } from "@/lib/online/liveGames";
import { formatClock } from "@/lib/chess/clock";

/** Live lobby: games in progress that anyone can open and watch. */
export default function WatchPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const [games, setGames] = useState<LiveGame[] | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;

    const unsubscribe = subscribeActiveGames((next) => {
      if (!cancelled) setGames(next);
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [isAuthenticated]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <PageHeader
        title="Watch"
        description="Live games happening right now — open one to spectate."
        actions={
          <Link
            href="/play/online"
            className="text-xs font-medium text-accent-link"
          >
            Play online
          </Link>
        }
      />

      {!isAuthenticated ? (
        <EmptyState
          title={isLoading ? "Loading…" : "Log in to watch live games"}
          description={
            isLoading
              ? undefined
              : "The live lobby is available to signed-in players (including guests)."
          }
          action={
            !isLoading ? (
              <Link
                href="/login?redirect=/watch"
                className="inline-block bg-accent-primary text-bg-primary font-semibold px-4 py-2 rounded-lg"
              >
                Log in
              </Link>
            ) : undefined
          }
        />
      ) : games === null ? (
        <div className="space-y-2">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      ) : games.length === 0 ? (
        <EmptyState
          title="No live games at the moment"
          description="Start one yourself — someone else might be watching."
          action={
            <Link
              href="/play/online"
              className="inline-block bg-accent-primary text-bg-primary font-semibold px-4 py-2 rounded-lg"
            >
              Play online
            </Link>
          }
        />
      ) : (
        <ul className="space-y-2">
          {games.map((game) => (
            <li key={game.gameId}>
              <Link
                href={`/play/online/${game.gameId}`}
                className="flex items-center gap-3 bg-bg-secondary hover:bg-bg-hover rounded-xl px-4 py-3"
              >
                <FiUsers size={16} className="text-accent-primary shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-text-primary truncate">
                    {game.whiteName}{" "}
                    <span className="text-text-muted">
                      ({game.whiteRating})
                    </span>{" "}
                    vs {game.blackName ?? "…"}{" "}
                    <span className="text-text-muted">
                      ({game.blackRating ?? "-"})
                    </span>
                  </p>
                  <p className="text-xs text-text-secondary">
                    {game.rated ? "rated" : "casual"} ·{" "}
                    {game.moveCount} {game.moveCount === 1 ? "move" : "moves"}{" "}
                    played
                  </p>
                </div>
                <span className="flex items-center gap-1 text-xs text-text-secondary">
                  <FiClock size={12} />
                  {formatClock(game.whiteMs)} – {formatClock(game.blackMs)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
