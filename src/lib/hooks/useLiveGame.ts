"use client";

import { useEffect, useState } from "react";
import { subscribeLiveGame, type LiveGame } from "@/lib/online/liveGames";

/** Live subscription to a single online game. */
export function useLiveGame(gameId: string | undefined) {
  const [game, setGame] = useState<LiveGame | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!gameId) return;
    let cancelled = false;

    const unsubscribe = subscribeLiveGame(gameId, (next) => {
      if (cancelled) return;
      setGame(next);
      setLoading(false);
      setError(next ? null : "That game is no longer available.");
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [gameId]);

  return { game, loading, error };
}
