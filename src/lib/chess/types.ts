import type { Square, PieceSymbol, Color } from "chess.js";

export type BoardThemeName =
  | "green"
  | "blue"
  | "brown"
  | "purple"
  | "grey"
  | "tournament"
  | "ice"
  | "wood";

export type PieceThemeName =
  | "neo"
  | "classic"
  | "wood"
  | "metal"
  | "8bit"
  | "staunty";

export type SoundEvent =
  | "move"
  | "capture"
  | "check"
  | "castle"
  | "promote"
  | "gameStart"
  | "gameEndWin"
  | "gameEndLoss"
  | "gameEndDraw"
  | "lowTime"
  | "illegal";

export interface MoveHistoryEntry {
  san: string;
  fen: string; // position AFTER this move
  moveNumber: number; // full-move number
  color: Color;
  captured?: PieceSymbol;
  from: Square;
  to: Square;
  isCheck: boolean;
  isCheckmate: boolean;
  isCastle: boolean;
  isPromotion: boolean;
  /** Piece chosen on promotion (undefined for every other move). */
  promotion?: "q" | "r" | "b" | "n";
}

export interface PendingPremove {
  from: Square;
  to: Square;
  promotion?: "q" | "r" | "b" | "n";
}

export interface ChessBoardHandle {
  flipBoard: () => void;
  resetBoard: (fen?: string) => void;
  undoMove: () => void;
  /** Programmatically apply a move (used by bot/online opponents to
   *  play their move on the shared board instance). Returns false if
   *  the move was illegal. */
  makeMove: (
    from: string,
    to: string,
    promotion?: "q" | "r" | "b" | "n"
  ) => boolean;
  /** All legal moves in the current live position, UCI format
   *  (e.g. "e2e4"), for feeding to the engine's blunder logic. */
  getLegalMovesUci: () => string[];
  getFen: () => string;
  /** Full local move history (used to report an online result). */
  getMoveHistory: () => MoveHistoryEntry[];
  /** Jump the move list / board to a given ply (-1 = starting position). */
  goToMove: (index: number) => void;
}

export type ArrowColor = "green" | "red" | "blue" | "yellow";

export interface BoardArrow {
  from: Square;
  to: Square;
  color: ArrowColor;
}
