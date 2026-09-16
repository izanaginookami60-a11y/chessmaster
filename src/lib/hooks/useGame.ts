"use client";

import { useEffect, useState } from "react";
import { fetchGame, type GameDocument } from "@/lib/firebase/games";

/** Load a single game document (viewer + analysis pages). */
export function useGame(gameId: string | undefined) {
  const [game, setGame] = useState<GameDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!gameId) return;
    let cancelled = false;

    fetchGame(gameId)
      .then((result) => {
        if (cancelled) return;
        setGame(result);
        setError(result ? null : "That game could not be found.");
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError((err as Error).message || "Could not load that game.");
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [gameId]);

  return { game, loading, error };
}
