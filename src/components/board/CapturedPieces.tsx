import type { PieceSymbol, Color } from "chess.js";

const PIECE_GLYPH: Record<Color, Record<PieceSymbol, string>> = {
  w: { p: "♙", n: "♘", b: "♗", r: "♖", q: "♕", k: "♔" },
  b: { p: "♟", n: "♞", b: "♝", r: "♜", q: "♛", k: "♚" },
};

interface CapturedPiecesProps {
  /** The color of the pieces being DISPLAYED (i.e. the pieces this
   *  player has captured from their opponent). */
  capturedColor: Color;
  pieces: PieceSymbol[];
  advantage?: number; // shown as +N, only pass on one side
}

export function CapturedPieces({
  capturedColor,
  pieces,
  advantage,
}: CapturedPiecesProps) {
  return (
    <div className="flex items-center gap-0.5 min-h-[24px] text-lg leading-none text-text-secondary">
      {pieces.map((p, i) => (
        <span key={i}>{PIECE_GLYPH[capturedColor][p]}</span>
      ))}
      {typeof advantage === "number" && advantage > 0 && (
        <span className="text-xs font-semibold text-text-secondary ml-1">
          +{advantage}
        </span>
      )}
    </div>
  );
}
