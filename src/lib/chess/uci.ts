import { Chess } from "chess.js";

/** Convert a UCI move ("e2e4") into SAN ("e4") for the given position. */
export function uciToSan(fen: string, uci: string): string | null {
  try {
    const game = new Chess(fen);
    const move = game.move({
      from: uci.slice(0, 2),
      to: uci.slice(2, 4),
      promotion: (uci[4] as "q" | "r" | "b" | "n" | undefined) ?? undefined,
    });
    return move?.san ?? null;
  } catch {
    return null;
  }
}

/** Convert a whole principal variation into SAN, stopping at the first
 *  move that no longer fits the position. */
export function uciListToSan(fen: string, uciMoves: string[]): string[] {
  const game = new Chess(fen);
  const sans: string[] = [];

  for (const uci of uciMoves) {
    let move;
    try {
      move = game.move({
        from: uci.slice(0, 2),
        to: uci.slice(2, 4),
        promotion: (uci[4] as "q" | "r" | "b" | "n" | undefined) ?? undefined,
      });
    } catch {
      break;
    }
    if (!move) break;
    sans.push(move.san);
  }

  return sans;
}

/** Numbered SAN line for display: "1. e4 e5 2. Nf3". */
export function formatSanLine(fen: string, sans: string[]): string {
  const startMoveNumber = Number(fen.split(" ")[5] ?? 1);
  const whiteToMove = fen.split(" ")[1] !== "b";
  const parts: string[] = [];
  let number = startMoveNumber;
  let needNumber = whiteToMove;

  for (const san of sans) {
    if (needNumber) {
      parts.push(`${number}.`);
      number += 1;
    }
    parts.push(san);
    needNumber = !needNumber;
  }

  return parts.join(" ");
}
