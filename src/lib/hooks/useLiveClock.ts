"use client";

import { useEffect, useRef, useState } from "react";
import { LOW_TIME_THRESHOLD_MS } from "@/lib/chess/clock";
import { soundManager } from "@/lib/chess/soundManager";
import type { LiveGame } from "@/lib/online/liveGames";

export interface LiveClocks {
  whiteMs: number;
  blackMs: number;
  /** True when the active side is under the low-time threshold. */
  low: boolean;
}

/**
 * Clock display for online games.
 *
 * The remaining time is *derived*, not stored: the game node keeps each
 * side's time as of `lastMoveAt`, so every client computes the same
 * tick-down without extra writes. When the active side reaches zero the
 * `onFlag` callback fires once (the winner claims the time-out).
 */
export function useLiveClock(
  game: LiveGame | null,
  onFlag: (loser: "w" | "b") => void
): LiveClocks {
  const [now, setNow] = useState<number | null>(null);
  const onFlagRef = useRef(onFlag);
  const flaggedRef = useRef(false);

  useEffect(() => {
    onFlagRef.current = onFlag;
  }, [onFlag]);

  // Re-render ticker (state updates happen inside the interval callback).
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);

  const lastMoveAt = game?.lastMoveAt ?? null;
  const moveCount = game?.moveCount ?? 0;
  const turn = game?.turn ?? "w";

  useEffect(() => {
    if (!lastMoveAt || !game || game.status !== "playing") return;

    flaggedRef.current = false;
    const side = turn;
    const baseMs = side === "w" ? game.whiteMs : game.blackMs;
    const start = lastMoveAt;
    let warned = false;

    const id = setInterval(() => {
      const remaining = baseMs - (Date.now() - start);

      if (remaining <= LOW_TIME_THRESHOLD_MS && !warned) {
        warned = true;
        soundManager.play("lowTime");
      }
      if (remaining <= 0 && !flaggedRef.current) {
        flaggedRef.current = true;
        onFlagRef.current(side);
      }
    }, 250);

    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastMoveAt, moveCount, turn, game?.status]);

  const elapsed = lastMoveAt && now ? Math.max(0, now - lastMoveAt) : 0;
  const whiteMs = game ? Math.max(0, game.whiteMs - (turn === "w" ? elapsed : 0)) : 0;
  const blackMs = game ? Math.max(0, game.blackMs - (turn === "b" ? elapsed : 0)) : 0;
  const ticking = !!game && game.status === "playing" && !!lastMoveAt;

  return {
    whiteMs: ticking ? whiteMs : game?.whiteMs ?? 0,
    blackMs: ticking ? blackMs : game?.blackMs ?? 0,
    low: ticking && Math.min(whiteMs, blackMs) <= LOW_TIME_THRESHOLD_MS,
  };
}
