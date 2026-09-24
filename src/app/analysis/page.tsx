"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FiClock, FiCpu, FiUsers, FiFilter } from "react-icons/fi";
import { PageHeader, EmptyState } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/lib/hooks/useAuth";
import {
  fetchGamesForUser,
  resultLabelForPlayer,
  type GameDocument,
} from "@/lib/firebase/games";

type Filter = "all" | "win" | "loss" | "draw";

const FILTERS: Array<{ id: Filter; label: string }> = [
  { id: "all", label: "All" },
  { id: "win", label: "Wins" },
  { id: "loss", label: "Losses" },
  { id: "draw", label: "Draws" },
];

const RESULT_STYLE: Record<"win" | "loss" | "draw", string> = {
  win: "bg-result-win/20 text-result-win",
  loss: "bg-result-loss/20 text-result-loss",
  draw: "bg-result-draw/20 text-result-draw",
};

export default function AnalysisHomePage() {
  const { firebaseUser, isAuthenticated, isLoading } = useAuth();
  const [games, setGames] = useState<GameDocument[] | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [error, setError] = useState<string | null>(null);

  const uid = isAuthenticated && firebaseUser ? firebaseUser.uid : null;

  useEffect(() => {
    if (!uid) return;
    let cancelled = false;

    fetchGamesForUser(uid, 40)
      .then((result) => {
        if (!cancelled) setGames(result);
      })
      .catch(() => {
        if (!cancelled) {
          setGames([]);
          setError(
            "Could not load your games. Deploy the indexes from firestore.indexes.json first."
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [uid]);

  const visible = (games ?? []).filter((game) => {
    if (!game.result) return false; // still in progress
    if (filter === "all" || !uid) return true;
    return resultLabelForPlayer(game, uid) === filter;
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <PageHeader
        title="Your games"
        description="Every game you have finished, ready to review."
      />
      {!uid ? (
        <EmptyState
          title={isLoading ? "Loading…" : "Log in to see your games"}
          description={
            isLoading
              ? undefined
              : "Games played while signed in are stored here for later analysis."
          }
          action={
            !isLoading ? (
              <Link
                href="/login?redirect=/analysis"
                className="inline-block bg-accent-primary text-bg-primary font-semibold px-4 py-2 rounded-lg"
              >
                Log in
              </Link>
            ) : undefined
          }
        />
      ) : (
        <>
          <div className="flex items-center gap-2 mb-4 text-sm">
            <FiFilter size={14} className="text-text-secondary" />
            {FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`px-3 py-1.5 rounded-lg font-medium ${
                  filter === f.id
                    ? "bg-accent-primary text-bg-primary"
                    : "bg-bg-secondary text-text-secondary hover:text-text-primary"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {games === null ? (
            <div className="space-y-2">
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </div>
          ) : visible.length === 0 ? (
            <EmptyState
              title={error ?? "No games here yet"}
              description={
                error ? undefined : "Play a game and it will show up here."
              }
              action={
                <Link
                  href="/play"
                  className="inline-block bg-accent-primary text-bg-primary font-semibold px-4 py-2 rounded-lg"
                >
                  Play a game
                </Link>
              }
            />
          ) : (
            <ul className="space-y-2">
              {visible.map((game) => {
                const outcome = resultLabelForPlayer(game, uid) ?? "draw";
                const opponent =
                  game.whitePlayerId === uid ? game.blackName : game.whiteName;
                const playedAs = game.whitePlayerId === uid ? "White" : "Black";

                return (
                  <li
                    key={game.id}
                    className="flex items-center gap-3 bg-bg-secondary rounded-xl px-4 py-3"
                  >
                    <span
                      className={`text-xs font-bold px-2 py-1 rounded uppercase ${
                        RESULT_STYLE[outcome]
                      }`}
                    >
                      {outcome}
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-text-primary truncate">
                        vs {opponent}{" "}
                        <span className="text-text-muted">as {playedAs}</span>
                      </p>
                      <p className="text-xs text-text-secondary flex items-center gap-2 mt-0.5">
                        {game.isBotGame ? (
                          <FiCpu size={12} />
                        ) : (
                          <FiUsers size={12} />
                        )}
                        {game.reason}
                        <span className="flex items-center gap-1">
                          <FiClock size={12} />
                          {game.timeControl === "unlimited"
                            ? "No clock"
                            : `${Math.round(
                                Number(game.timeControl) / 60
                              )} min`}
                        </span>
                        {game.rated && (
                          <span className="text-accent-link">rated</span>
                        )}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/game/${game.id}`}
                        className="text-xs font-medium text-text-secondary hover:text-text-primary"
                      >
                        Replay
                      </Link>
                      <Link
                        href={`/analysis/${game.id}`}
                        className="text-xs font-medium bg-bg-primary hover:bg-bg-hover text-text-primary px-3 py-1.5 rounded-lg"
                      >
                        Analyse
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}

    </div>
  );
}
