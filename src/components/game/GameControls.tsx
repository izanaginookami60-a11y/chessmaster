import { FiFlag, FiRefreshCw, FiRotateCcw, FiHelpCircle } from "react-icons/fi";

interface GameControlsProps {
  onResign: () => void;
  onOfferDraw: () => void;
  onUndo: () => void;
  onNewGame: () => void;
  onHint: () => void;
  canUndo: boolean;
  gameOver: boolean;
}

export function GameControls({
  onResign,
  onOfferDraw,
  onUndo,
  onNewGame,
  onHint,
  canUndo,
  gameOver,
}: GameControlsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {!gameOver ? (
        <>
          <button
            onClick={onResign}
            className="flex items-center gap-1.5 text-xs font-medium text-result-loss bg-bg-secondary hover:bg-bg-hover px-3 py-2 rounded-lg"
          >
            <FiFlag size={14} /> Resign
          </button>
          <button
            onClick={onOfferDraw}
            className="flex items-center gap-1.5 text-xs font-medium text-text-secondary bg-bg-secondary hover:bg-bg-hover px-3 py-2 rounded-lg"
          >
            <FiRefreshCw size={14} /> Offer draw
          </button>
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="flex items-center gap-1.5 text-xs font-medium text-text-secondary bg-bg-secondary hover:bg-bg-hover px-3 py-2 rounded-lg disabled:opacity-40"
          >
            <FiRotateCcw size={14} /> Undo
          </button>
          <button
            onClick={onHint}
            className="flex items-center gap-1.5 text-xs font-medium text-accent-link bg-bg-secondary hover:bg-bg-hover px-3 py-2 rounded-lg"
          >
            <FiHelpCircle size={14} /> Hint
          </button>
        </>
      ) : (
        <button
          onClick={onNewGame}
          className="flex items-center gap-1.5 text-sm font-semibold text-bg-primary bg-accent-primary px-4 py-2 rounded-lg"
        >
          New game
        </button>
      )}
    </div>
  );
}
