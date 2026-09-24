import { Chess, type Move } from "chess.js";

/**
 * Safe move application.
 *
 * chess.js v1 **throws** on an invalid move (`Invalid move: ...`) instead of
 * returning null, so every UI-driven attempt has to be wrapped. Board
 * libraries happily hand us no-op drops (same square) and stale positions
 * (someone else moved first), which must never crash the page.
 */
export function tryMove(
  game: Chess,
  from: string,
  to: string,
  promotion?: "q" | "r" | "b" | "n"
): Move | null {
  if (!from || !to || from === to) return null;

  try {
    return game.move({ from, to, promotion }) ?? null;
  } catch {
    return null;
  }
}

/** True when a drop/click is a no-op (piece put back on its own square). */
export function isSameSquare(from: string | null, to: string | null): boolean {
  return !!from && !!to && from === to;
}
