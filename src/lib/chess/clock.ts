/**
 * Chess clock maths, kept pure so it can be unit-tested without a DOM.
 * Everything is in milliseconds.
 */

export const LOW_TIME_THRESHOLD_MS = 10_000;

export interface ClockState {
  whiteMs: number;
  blackMs: number;
  /** The side whose clock is currently ticking. */
  active: "w" | "b" | null;
  /** False once the game (or clock) has finished. */
  running: boolean;
}

export interface ClockConfig {
  /** Starting time in ms for each side. */
  initialMs: number;
  /** Increment in ms added after each move (0 for none). */
  incrementMs: number;
}

export function createClock(config: ClockConfig, first: "w" | "b"): ClockState {
  return {
    whiteMs: config.initialMs,
    blackMs: config.initialMs,
    active: first,
    running: false,
  };
}

/**
 * Remove `elapsedMs` from the active side's clock and return the new
 * state plus the side that flagged (if any).
 */
export function tick(
  state: ClockState,
  elapsedMs: number
): { state: ClockState; flagged: "w" | "b" | null } {
  if (!state.running || !state.active || elapsedMs <= 0) {
    return { state, flagged: null };
  }

  const remaining = Math.max(
    0,
    (state.active === "w" ? state.whiteMs : state.blackMs) - elapsedMs
  );

  const next: ClockState =
    state.active === "w"
      ? { ...state, whiteMs: remaining, running: remaining > 0 }
      : { ...state, blackMs: remaining, running: remaining > 0 };

  return { state: next, flagged: remaining === 0 ? state.active : null };
}

/** Handle a move: apply the increment and pass the clock to the opponent. */
export function switchTurn(state: ClockState, config: ClockConfig): ClockState {
  if (!state.active) return state;

  const bumped: ClockState =
    state.active === "w"
      ? { ...state, whiteMs: state.whiteMs + config.incrementMs }
      : { ...state, blackMs: state.blackMs + config.incrementMs };

  return {
    ...bumped,
    active: state.active === "w" ? "b" : "w",
    running: bumped.whiteMs > 0 && bumped.blackMs > 0,
  };
}

/** mm:ss, or m:ss.t below ten seconds (like chess.com). */
export function formatClock(ms: number): string {
  const safe = Math.max(0, ms);
  const totalSeconds = Math.floor(safe / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (safe < LOW_TIME_THRESHOLD_MS) {
    const tenths = Math.floor((safe % 1000) / 100);
    return `${minutes}:${String(seconds).padStart(2, "0")}.${tenths}`;
  }

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

/** Parse the `?time=` search param (seconds, or "unlimited"). */
export function parseTimeControl(
  value: string | null,
  increments: Record<string, number> = {}
): ClockConfig | null {
  if (!value || value === "unlimited" || value === "0") return null;
  const seconds = Number(value);
  if (!Number.isFinite(seconds) || seconds <= 0) return null;
  return {
    initialMs: seconds * 1000,
    incrementMs: increments[value] ?? defaultIncrement(seconds),
  };
}

/**
 * Conventional increment for a base time, mirroring how the big sites
 * pair time controls (bullet gets none, longer games get a couple of
 * seconds).
 */
export function defaultIncrement(seconds: number): number {
  if (seconds <= 60) return 0;
  if (seconds <= 180) return 2000;
  if (seconds <= 600) return 3000;
  return 5000;
}
