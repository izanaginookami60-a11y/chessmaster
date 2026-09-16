/**
 * Elo maths for rated games. Kept dependency-free so it is trivially
 * unit-testable and reusable from any trigger.
 */

export interface RatingPair {
  white: number;
  black: number;
}

export type GameOutcome = "white" | "black" | "draw";

export type TimeBucket = "bullet" | "blitz" | "rapid";

/** Rating bucket for a `?time=` value in seconds ("unlimited" → rapid). */
export function bucketForTimeControl(seconds: number | null): TimeBucket {
  if (seconds === null) return "rapid";
  if (seconds <= 120) return "bullet";
  if (seconds <= 600) return "blitz";
  return "rapid";
}

/**
 * K-factor: provisional players move faster than established ones.
 * 40 below 30 games, 20 above 2400 rating, otherwise 24.
 */
export function kFactor(rating: number, gamesPlayed: number): number {
  if (gamesPlayed < 30) return 40;
  if (rating >= 2400) return 20;
  return 24;
}

export function expectedScore(rating: number, opponentRating: number): number {
  return 1 / (1 + Math.pow(10, (opponentRating - rating) / 400));
}

/** Score for a side: 1 win, 0.5 draw, 0 loss. */
export function scoreFor(side: "white" | "black", outcome: GameOutcome): number {
  if (outcome === "draw") return 0.5;
  return outcome === side ? 1 : 0;
}

export interface RatingUpdate extends RatingPair {
  whiteDelta: number;
  blackDelta: number;
}

/**
 * Apply Elo to both players. Ratings are floored at 100 and rounded to
 * whole numbers (Firestore stores ints for easy sorting).
 */
export function applyElo(
  ratings: RatingPair,
  outcome: GameOutcome,
  gamesPlayed: RatingPair
): RatingUpdate {
  const whiteK = kFactor(ratings.white, gamesPlayed.white);
  const blackK = kFactor(ratings.black, gamesPlayed.black);

  const whiteExpected = expectedScore(ratings.white, ratings.black);
  const blackExpected = expectedScore(ratings.black, ratings.white);

  const whiteScore = scoreFor("white", outcome);
  const blackScore = scoreFor("black", outcome);

  const whiteNext = Math.max(
    100,
    Math.round(ratings.white + whiteK * (whiteScore - whiteExpected))
  );
  const blackNext = Math.max(
    100,
    Math.round(ratings.black + blackK * (blackScore - blackExpected))
  );

  return {
    white: whiteNext,
    black: blackNext,
    whiteDelta: whiteNext - ratings.white,
    blackDelta: blackNext - ratings.black,
  };
}

/** Result string for a player ("Result" PGN style). */
export function resultToPgn(outcome: GameOutcome): "1-0" | "0-1" | "1/2-1/2" {
  if (outcome === "draw") return "1/2-1/2";
  return outcome === "white" ? "1-0" : "0-1";
}

/** True when a player id represents a real, rateable account. */
export function isRateableUserId(userId: string | undefined | null): boolean {
  if (!userId) return false;
  if (userId === "guest") return false;
  if (userId.startsWith("bot_")) return false;
  return true;
}
