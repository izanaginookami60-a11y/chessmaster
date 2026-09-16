import type { Chess, PieceSymbol, Color } from "chess.js";

const PIECE_VALUES: Record<PieceSymbol, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 0,
};

const STARTING_COUNTS: Record<PieceSymbol, number> = {
  p: 8,
  n: 2,
  b: 2,
  r: 2,
  q: 1,
  k: 1,
};

export interface MaterialInfo {
  capturedByWhite: PieceSymbol[]; // black pieces white has captured
  capturedByBlack: PieceSymbol[]; // white pieces black has captured
  advantage: number; // positive = white ahead, negative = black ahead
}

export function computeMaterial(game: Chess): MaterialInfo {
  const board = game.board();
  const remaining: Record<Color, Record<PieceSymbol, number>> = {
    w: { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 },
    b: { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 },
  };

  for (const row of board) {
    for (const square of row) {
      if (square) {
        remaining[square.color][square.type]++;
      }
    }
  }

  const capturedByWhite: PieceSymbol[] = []; // black pieces missing
  const capturedByBlack: PieceSymbol[] = []; // white pieces missing

  (Object.keys(STARTING_COUNTS) as PieceSymbol[]).forEach((type) => {
    if (type === "k") return;
    const blackMissing = STARTING_COUNTS[type] - remaining.b[type];
    const whiteMissing = STARTING_COUNTS[type] - remaining.w[type];
    for (let i = 0; i < blackMissing; i++) capturedByWhite.push(type);
    for (let i = 0; i < whiteMissing; i++) capturedByBlack.push(type);
  });

  const sortByValue = (a: PieceSymbol, b: PieceSymbol) =>
    PIECE_VALUES[b] - PIECE_VALUES[a];
  capturedByWhite.sort(sortByValue);
  capturedByBlack.sort(sortByValue);

  const whiteValue = capturedByWhite.reduce((s, t) => s + PIECE_VALUES[t], 0);
  const blackValue = capturedByBlack.reduce((s, t) => s + PIECE_VALUES[t], 0);

  return {
    capturedByWhite,
    capturedByBlack,
    advantage: whiteValue - blackValue,
  };
}
