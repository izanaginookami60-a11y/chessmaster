"use client";

import { FiRotateCw, FiGrid, FiVolume2, FiVolumeX } from "react-icons/fi";
import { BOARD_THEME_LIST } from "@/lib/chess/boardThemes";
import { PIECE_THEME_LIST } from "@/lib/chess/pieceThemes";
import type { BoardThemeName, PieceThemeName } from "@/lib/chess/types";

interface BoardControlsProps {
  onFlip: () => void;
  showCoordinates: boolean;
  onToggleCoordinates: () => void;
  boardTheme: BoardThemeName;
  onBoardThemeChange: (theme: BoardThemeName) => void;
  pieceTheme: PieceThemeName;
  onPieceThemeChange: (theme: PieceThemeName) => void;
  muted: boolean;
  onToggleMuted: () => void;
}

export function BoardControls({
  onFlip,
  showCoordinates,
  onToggleCoordinates,
  boardTheme,
  onBoardThemeChange,
  pieceTheme,
  onPieceThemeChange,
  muted,
  onToggleMuted,
}: BoardControlsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 py-2">
      <button
        onClick={onFlip}
        className="flex items-center gap-1.5 text-xs font-medium text-text-secondary hover:text-text-primary bg-bg-secondary px-2.5 py-1.5 rounded-lg"
        title="Flip board"
      >
        <FiRotateCw size={14} /> Flip
      </button>

      <button
        onClick={onToggleCoordinates}
        className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg ${
          showCoordinates
            ? "text-accent-primary bg-accent-primary/10"
            : "text-text-secondary hover:text-text-primary bg-bg-secondary"
        }`}
        title="Toggle coordinates"
      >
        <FiGrid size={14} /> Coords
      </button>

      <button
        onClick={onToggleMuted}
        className="flex items-center gap-1.5 text-xs font-medium text-text-secondary hover:text-text-primary bg-bg-secondary px-2.5 py-1.5 rounded-lg"
        title={muted ? "Unmute sound" : "Mute sound"}
      >
        {muted ? <FiVolumeX size={14} /> : <FiVolume2 size={14} />}
      </button>

      <select
        value={boardTheme}
        onChange={(e) => onBoardThemeChange(e.target.value as BoardThemeName)}
        className="text-xs bg-bg-secondary text-text-primary rounded-lg px-2 py-1.5 border-none outline-none"
      >
        {BOARD_THEME_LIST.map((t) => (
          <option key={t.name} value={t.name}>
            Board: {t.label}
          </option>
        ))}
      </select>

      <select
        value={pieceTheme}
        onChange={(e) => onPieceThemeChange(e.target.value as PieceThemeName)}
        className="text-xs bg-bg-secondary text-text-primary rounded-lg px-2 py-1.5 border-none outline-none"
      >
        {PIECE_THEME_LIST.map((t) => (
          <option key={t.name} value={t.name}>
            Pieces: {t.label}
          </option>
        ))}
      </select>
    </div>
  );
}
