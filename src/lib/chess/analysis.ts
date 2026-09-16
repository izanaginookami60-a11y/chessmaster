/**
 * Centipawn → win-probability and move-quality helpers used by the
 * analysis board. Thresholds roughly follow the conventions players are
 * used to from chess.com/lichess: half a pawn is an inaccuracy, a full
 * pawn is a mistake, and two and a half pawns is a blunder.
 */

export const MATE_SCORE = 10000;

export type MoveQuality =
  | "brilliant"
  | "great"
  | "best"
  | "good"
  | "book"
  | "inaccuracy"
  | "mistake"
  | "blunder";

export const MOVE_QUALITY_LABEL: Record<MoveQuality, string> = {
  brilliant: "Brilliant",
  great: "Great",
  best: "Best",
  good: "Good",
  book: "Book",
  inaccuracy: "Inaccuracy",
  mistake: "Mistake",
  blunder: "Blunder",
};

export const MOVE_QUALITY_ICON: Record<MoveQuality, string> = {
  brilliant: "!!",
  great: "!",
  best: "★",
  good: "✓",
  book: "📖",
  inaccuracy: "?!",
  mistake: "?",
  blunder: "??",
};

/** Tailwind text colour class for each quality (uses the design tokens). */
export const MOVE_QUALITY_COLOR: Record<MoveQuality, string> = {
  brilliant: "text-evalcolor-brilliant",
  great: "text-evalcolor-great",
  best: "text-evalcolor-best",
  good: "text-evalcolor-good",
  book: "text-evalcolor-book",
  inaccuracy: "text-evalcolor-inaccuracy",
  mistake: "text-evalcolor-mistake",
  blunder: "text-evalcolor-blunder",
};

/**
 * Convert a centipawn evaluation (side-to-move independent, always from
 * White's point of view) into White's win probability (0-1).
 */
export function evalToWinProbability(cp: number): number {
  const clamped = Math.max(-MATE_SCORE, Math.min(MATE_SCORE, cp));
  return 1 / (1 + Math.exp(-clamped / 400));
}

export function formatEval(cp: number, mateIn?: number | null): string {
  if (mateIn !== undefined && mateIn !== null) {
    return `#${mateIn > 0 ? "+" : "-"}${Math.abs(mateIn)}`;
  }
  const pawns = cp / 100;
  return `${pawns > 0 ? "+" : ""}${pawns.toFixed(2)}`;
}

/**
 * How much did this move cost the player who made it?
 * `beforeCp` / `afterCp` are both from White's point of view.
 */
export function centipawnLoss(
  beforeCp: number,
  afterCp: number,
  mover: "w" | "b"
): number {
  if (mover === "w") return Math.max(0, beforeCp - afterCp);
  return Math.max(0, afterCp - beforeCp);
}

export function classifyMove(
  loss: number,
  isBook: boolean
): MoveQuality {
  if (isBook) return "book";
  if (loss >= 250) return "blunder";
  if (loss >= 100) return "mistake";
  if (loss >= 50) return "inaccuracy";
  if (loss <= 10) return "best";
  return "good";
}

export interface GameAccuracy {
  white: number;
  black: number;
}

/**
 * Turn a list of centipawn losses into a 0-100 accuracy score per side
 * (an exponential decay: small losses barely matter, blunders hurt a lot).
 */
export function computeAccuracy(
  losses: Array<{ loss: number; mover: "w" | "b" }>
): GameAccuracy {
  const buckets: Record<"w" | "b", number[]> = { w: [], b: [] };
  for (const { loss, mover } of losses) buckets[mover].push(loss);

  const score = (values: number[]) => {
    if (values.length === 0) return 100;
    const total = values.reduce((sum, loss) => sum + Math.exp(-loss / 200), 0);
    return Math.round((total / values.length) * 1000) / 10;
  };

  return { white: score(buckets.w), black: score(buckets.b) };
}
