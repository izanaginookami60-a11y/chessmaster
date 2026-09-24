"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FiClock, FiCpu, FiUsers } from "react-icons/fi";
import { useAuth } from "@/lib/hooks/useAuth";
import {
  fetchGamesForUser,
  resultLabelForPlayer,
  type GameDocument,
} from "@/lib/firebase/games";
import { SectionTitle } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";

const RESULT_STYLE: Record<"win" | "loss" | "draw", string> = {
  win: "bg-result-win/20 text-result-win",
  loss: "bg-result-loss/20 text-result-loss",
  draw: "bg-result-draw/20 text-result-draw",
};

export function RecentGames({ limit = 5 }: { limit?: number }) {
  const { firebaseUser, isAuthenticated } = useAuth();
  const [games, setGames] = useState<GameDocument[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const uid = isAuthenticated && firebaseUser ? firebaseUser.uid : null;

  useEffect(() => {
    if (!uid) return;
    let cancelled = false;

    fetchGamesForUser(uid, limit)
      .then((result) => {
        if (!cancelled) setGames(result);
      })
      .catch(() => {
        if (!cancelled) {
          setGames([]);
          setError("Recent games need a Firestore index — see README.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [uid, limit]);

  if (!uid) return null;

  return (
    <section>
      <SectionTitle
        action={
          <Link href="/analysis" className="text-xs font-medium text-accent-link">
            Game history
          </Link>
        }
      >
        Your recent games
      </SectionTitle>

      {games === null ? (
        <div className="space-y-2">
          <Skeleton className="h-14" />
          <Skeleton className="h-14" />
        </div>
      ) : games.length === 0 ? (
        <p className="text-sm text-text-secondary bg-bg-secondary rounded-xl p-4">
          {error ?? "No games yet — play one to see it here."}
        </p>
      ) : (
        <ul className="space-y-2">
          {games
            .filter((game) => !!game.result)
            .map((game) => {
              const outcome = resultLabelForPlayer(game, uid) ?? "draw";
            const opponent =
              game.whitePlayerId === uid ? game.blackName : game.whiteName;
            const playedAs = game.whitePlayerId === uid ? "White" : "Black";

            return (
              <li key={game.id}>
                <Link
                  href={`/game/${game.id}`}
                  className="flex items-center gap-3 bg-bg-secondary hover:bg-bg-hover rounded-xl px-4 py-3"
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
                      {game.rated && <span className="text-accent-link">rated</span>}
                    </p>
                  </div>
                  <span className="text-xs text-text-secondary flex items-center gap-1">
                    <FiClock size={12} />
                    {game.timeControl === "unlimited"
                      ? "No clock"
                      : `${Math.round(Number(game.timeControl) / 60)} min`}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
