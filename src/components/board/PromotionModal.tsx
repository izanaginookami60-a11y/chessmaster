import type { Color } from "chess.js";

const PROMOTION_PIECES: Array<{
  type: "q" | "r" | "b" | "n";
  label: string;
}> = [
  { type: "q", label: "Queen" },
  { type: "r", label: "Rook" },
  { type: "b", label: "Bishop" },
  { type: "n", label: "Knight" },
];

const GLYPH: Record<Color, Record<"q" | "r" | "b" | "n", string>> = {
  w: { q: "♕", r: "♖", b: "♗", n: "♘" },
  b: { q: "♛", r: "♜", b: "♝", n: "♞" },
};

interface PromotionModalProps {
  color: Color;
  onSelect: (piece: "q" | "r" | "b" | "n") => void;
  onCancel: () => void;
}

export function PromotionModal({
  color,
  onSelect,
  onCancel,
}: PromotionModalProps) {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60">
      <div className="bg-bg-secondary rounded-xl p-5 shadow-lg">
        <p className="text-sm font-semibold text-text-primary mb-3 text-center">
          Promote pawn to
        </p>
        <div className="flex gap-2">
          {PROMOTION_PIECES.map((p) => (
            <button
              key={p.type}
              onClick={() => onSelect(p.type)}
              className="w-14 h-14 flex items-center justify-center text-4xl bg-bg-primary hover:bg-accent-primary/20 rounded-lg border border-bg-hover transition-colors"
              title={p.label}
            >
              {GLYPH[color][p.type]}
            </button>
          ))}
        </div>
        <button
          onClick={onCancel}
          className="w-full mt-3 text-xs text-text-secondary hover:text-text-primary"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
