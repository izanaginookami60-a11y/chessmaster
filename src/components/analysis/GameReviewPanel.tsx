"use client";

import { FiCpu, FiRefreshCw } from "react-icons/fi";
import { useGameReview } from "@/lib/hooks/useGameReview";
import {
  MOVE_QUALITY_COLOR,
  MOVE_QUALITY_ICON,
  MOVE_QUALITY_LABEL,
} from "@/lib/chess/analysis";

export function GameReviewPanel({
  moves,
  startFen,
  onSelectMove,
}: {
  moves: string[];
  startFen?: string;
  onSelectMove?: (ply: number) => void;
}) {
  const { review, accuracy, progress, running, error, run } = useGameReview({
    moves,
    startFen,
  });

  const percent =
    progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <div className="bg-bg-secondary rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
          <FiCpu size={15} className="text-accent-primary" /> Game report
        </h2>
        <button
          onClick={() => void run()}
          disabled={running || moves.length === 0}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-accent-link disabled:opacity-50"
        >
          <FiRefreshCw size={12} />
          {running ? `Analysing ${percent}%` : review ? "Re-analyse" : "Analyse game"}
        </button>
      </div>

      {running && (
        <div className="h-1.5 bg-bg-primary rounded-full overflow-hidden mb-3">
          <div
            className="h-full bg-accent-primary transition-[width]"
            style={{ width: `${percent}%` }}
          />
        </div>
      )}

      {error && <p className="text-xs text-result-loss">{error}</p>}

      {accuracy && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-bg-primary rounded-lg p-3">
            <p className="text-xs text-text-secondary">White accuracy</p>
            <p className="text-xl font-bold text-text-primary">
              {accuracy.white}%
            </p>
          </div>
          <div className="bg-bg-primary rounded-lg p-3">
            <p className="text-xs text-text-secondary">Black accuracy</p>
            <p className="text-xl font-bold text-text-primary">
              {accuracy.black}%
            </p>
          </div>
        </div>
      )}

      {review ? (
        <ul className="max-h-72 overflow-y-auto divide-y divide-bg-hover text-sm">
          {review.map((move) => (
            <li key={move.ply}>
              <button
                onClick={() => onSelectMove?.(move.ply)}
                className="w-full flex items-center gap-2 py-1.5 text-left hover:bg-bg-hover rounded px-1"
              >
                <span className="w-8 text-xs text-text-muted">
                  {move.color === "w"
                    ? `${Math.floor(move.ply / 2) + 1}.`
                    : "…"}
                </span>
                <span className="font-medium text-text-primary w-16">
                  {move.san}
                </span>
                <span
                  className={`text-xs font-semibold ${MOVE_QUALITY_COLOR[move.quality]}`}
                >
                  {MOVE_QUALITY_ICON[move.quality]}{" "}
                  {MOVE_QUALITY_LABEL[move.quality]}
                </span>
                {move.loss >= 50 && (
                  <span className="text-xs text-text-muted ml-auto">
                    -{(move.loss / 100).toFixed(2)}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        !running &&
        !error && (
          <p className="text-xs text-text-secondary">
            Run a full-game analysis to see accuracy, best moves and the
            mistakes that decided the game.
          </p>
        )
      )}
    </div>
  );
}
