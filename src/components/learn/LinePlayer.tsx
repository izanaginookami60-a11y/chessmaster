"use client";

import { useEffect, useRef, useState } from "react";
import { FiChevronLeft, FiChevronRight, FiPause, FiPlay, FiRotateCcw } from "react-icons/fi";
import { ChessBoard } from "@/components/board/ChessBoard";
import { useBoardWidth } from "@/lib/hooks/useBoardWidth";
import { START_FEN } from "@/lib/chess/pgn";
import type { ChessBoardHandle } from "@/lib/chess/types";

interface LinePlayerProps {
  /** Starting position (defaults to the initial position). */
  fen?: string;
  /** Moves in SAN, played on top of `fen`. */
  moves: string[];
  title?: string;
  caption?: string;
  /** Auto-play the line once when the player mounts. */
  autoPlay?: boolean;
  boardWidth?: number;
}

/**
 * Read-only board that walks through a line of moves — shared by the
 * lesson pages and the opening explorer. The board itself owns the move
 * list; this component just drives the position index.
 */
export function LinePlayer({
  fen = START_FEN,
  moves,
  title,
  caption,
  autoPlay = false,
  boardWidth,
}: LinePlayerProps) {
  const boardRef = useRef<ChessBoardHandle>(null);
  const fallbackWidth = useBoardWidth({ max: 440 });
  const [step, setStep] = useState(-1); // -1 = starting position
  const [playing, setPlaying] = useState(autoPlay);
  const stepRef = useRef(step);

  useEffect(() => {
    stepRef.current = step;
  }, [step]);

  // Auto-play: all state writes happen inside the interval callback.
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      const next = stepRef.current + 1;
      if (next > moves.length - 1) {
        setPlaying(false);
        return;
      }
      setStep(next);
    }, 900);
    return () => clearInterval(id);
  }, [playing, moves.length]);

  // Push the current step into the board (imperative, no React state).
  useEffect(() => {
    boardRef.current?.goToMove(step);
  }, [step]);

  return (
    <div>
      {title && (
        <p className="text-sm font-semibold text-text-primary mb-2">{title}</p>
      )}

      <ChessBoard
        ref={boardRef}
        initialFen={fen}
        initialMoves={moves}
        allowedColor="both"
        readOnly
        boardWidth={boardWidth ?? fallbackWidth}
        hideMoveList
      />

      <div className="flex flex-wrap items-center gap-2 mt-3">
        <button
          onClick={() => {
            setPlaying(false);
            setStep((current) => Math.max(-1, current - 1));
          }}
          className="p-2 rounded-lg bg-bg-secondary hover:bg-bg-hover text-text-primary"
          aria-label="Previous move"
        >
          <FiChevronLeft size={16} />
        </button>
        <button
          onClick={() => {
            if (playing) {
              setPlaying(false);
              return;
            }
            if (step >= moves.length - 1) setStep(-1);
            setPlaying(true);
          }}
          className="p-2 rounded-lg bg-accent-primary text-bg-primary"
          aria-label={playing ? "Pause" : "Play"}
        >
          {playing ? <FiPause size={16} /> : <FiPlay size={16} />}
        </button>
        <button
          onClick={() => {
            setPlaying(false);
            setStep((current) => Math.min(moves.length - 1, current + 1));
          }}
          className="p-2 rounded-lg bg-bg-secondary hover:bg-bg-hover text-text-primary"
          aria-label="Next move"
        >
          <FiChevronRight size={16} />
        </button>
        <button
          onClick={() => {
            setPlaying(false);
            setStep(-1);
          }}
          className="p-2 rounded-lg bg-bg-secondary hover:bg-bg-hover text-text-primary"
          aria-label="Restart"
        >
          <FiRotateCcw size={16} />
        </button>

        <span className="text-xs text-text-muted ml-1">
          {Math.max(0, step + 1)}/{moves.length}
        </span>
      </div>

      {caption && (
        <p className="text-xs text-text-secondary mt-2">{caption}</p>
      )}
    </div>
  );
}
