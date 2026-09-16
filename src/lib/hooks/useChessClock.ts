"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { LOW_TIME_THRESHOLD_MS, createClock, tick, switchTurn, formatClock } from "@/lib/chess/clock";
import type { ClockConfig, ClockState } from "@/lib/chess/clock";
import { soundManager } from "@/lib/chess/soundManager";

export interface ChessClockApi {
  state: ClockState;
  /** Call after the move is committed (applies increment + swaps side). */
  onMovePlayed: () => void;
  /** Start ticking (e.g. after the user clicks "start" or the first move). */
  start: () => void;
  pause: () => void;
  reset: (config: ClockConfig, first: "w" | "b") => void;
}

/**
 * Client-side chess clock. Ticks every 100ms while it is someone's turn,
 * emits the low-time warning once per flag-risk window, and calls
 * `onFlag` when a player runs out of time.
 */
export function useChessClock({
  config,
  initialTurn,
  onFlag,
  enabled = true,
}: {
  config: ClockConfig | null;
  initialTurn: "w" | "b";
  onFlag: (loser: "w" | "b") => void;
  enabled?: boolean;
}): ChessClockApi {
  const [state, setState] = useState<ClockState>(() =>
    config
      ? { ...createClock(config, initialTurn), running: enabled }
      : { whiteMs: 0, blackMs: 0, active: null, running: false }
  );

  const configRef = useRef(config);
  const onFlagRef = useRef(onFlag);
  const lowWarnedRef = useRef<{ w: boolean; b: boolean }>({ w: false, b: false });
  const lastTickRef = useRef<number>(0);

  // Keep the latest callback/config in refs — writing refs during render
  // is not allowed in React 19, so this happens in an effect.
  useEffect(() => {
    configRef.current = config;
    onFlagRef.current = onFlag;
  }, [config, onFlag]);

  useEffect(() => {
    if (!config || !state.running || !state.active) return;

    lastTickRef.current = Date.now();
    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = now - lastTickRef.current;
      lastTickRef.current = now;

      setState((prev) => {
        const { state: next, flagged } = tick(prev, elapsed);
        if (flagged) {
          onFlagRef.current(flagged);
          return { ...next, active: null };
        }

        const active = next.active;
        if (active) {
          const remaining = active === "w" ? next.whiteMs : next.blackMs;
          if (
            remaining <= LOW_TIME_THRESHOLD_MS &&
            !lowWarnedRef.current[active]
          ) {
            lowWarnedRef.current[active] = true;
            soundManager.play("lowTime");
          }
        }
        return next;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [config, state.running, state.active]);

  const api = useMemo<ChessClockApi>(
    () => ({
      state,
      start: () =>
        setState((prev) => (prev.active ? { ...prev, running: true } : prev)),
      pause: () => setState((prev) => ({ ...prev, running: false })),
      reset: (next, first) => {
        lowWarnedRef.current = { w: false, b: false };
        lastTickRef.current = Date.now();
        setState({ ...createClock(next, first), running: enabled });
      },
      onMovePlayed: () =>
        setState((prev) => {
          const cfg = configRef.current;
          if (!cfg) return prev;
          lowWarnedRef.current = {
            ...lowWarnedRef.current,
            [prev.active === "w" ? "b" : "w"]: false,
          };
          return switchTurn({ ...prev, running: enabled }, cfg);
        }),
    }),
    [state, enabled]
  );

  return api;
}

export { formatClock };
