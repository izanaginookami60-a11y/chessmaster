"use client";

import { useEffect, useMemo, useState } from "react";
import { ChessBoard } from "@/components/board/ChessBoard";
import { useBoardWidth } from "@/lib/hooks/useBoardWidth";
import type { Puzzle } from "@/lib/puzzles";
import { uciToSan } from "@/lib/chess/uci";

interface PuzzleBoardProps {
  puzzle: Puzzle;
  /** Called once every solution move has been played. */
  onSolved: () => void;
  /** Called when the solver plays a move that is not the solution. */
  onWrongMove?: () => void;
  /** Reveal the answer: stop accepting input. */
  locked?: boolean;
  boardWidth?: number;
}

/**
 * Plays a puzzle move-by-move. The board is remounted for each step with
 * the moves played so far as `initialMoves`, and only the expected move is
 * accepted via the board's `allowedMovesUci` filter.
 *
 * Mount it with a `key` derived from the puzzle id so a new puzzle starts
 * with fresh state.
 */
export function PuzzleBoard({
  puzzle,
  onSolved,
  onWrongMove,
  locked = false,
  boardWidth,
}: PuzzleBoardProps) {
  const [step, setStep] = useState(0);
  const [waitingForOpponent, setWaitingForOpponent] = useState(false);
  const fallbackWidth = useBoardWidth({ max: 460 });
  const expected = puzzle.moves[step];
  const solved = step >= puzzle.moves.length;
  const solverColor = puzzle.fen.split(" ")[1] === "b" ? "b" : "w";

  // The opponent's reply is forced, so it is played automatically.
  useEffect(() => {
    if (!waitingForOpponent) return;
    const id = window.setTimeout(() => {
      setWaitingForOpponent(false);
      setStep((current) => current + 1);
    }, 450);
    return () => window.clearTimeout(id);
  }, [waitingForOpponent]);

  const playedMoves = useMemo(
    () => puzzle.moves.slice(0, step),
    [puzzle.moves, step]
  );

  function handleMove() {
    const next = step + 1;

    if (next >= puzzle.moves.length) {
      setStep(next);
      onSolved();
      return;
    }

    // Next move belongs to the opponent — play it after a short pause.
    setStep(next);
    setWaitingForOpponent(true);
  }

  return (
    <div>
      <ChessBoard
        key={`${puzzle.id}-${step}`}
        initialFen={puzzle.fen}
        initialMoves={playedMoves}
        allowedColor={solverColor}
        readOnly={locked || solved}
        allowedMovesUci={
          expected && !solved ? [expected] : undefined
        }
        onIllegalAllowedMove={onWrongMove}
        boardWidth={boardWidth ?? fallbackWidth}
        hideMoveList
        onMove={handleMove}
      />

      <p className="text-xs text-text-secondary mt-3">
        {solved
          ? `Solved — ${puzzle.moves
              .filter((_, index) => index % 2 === 0)
              .map((uci) => uciToSan(puzzle.fen, uci) ?? uci)
              .join(", ")}`
          : puzzle.type === "mate"
          ? "Find the mate."
          : "Win material with the best move."}
      </p>
    </div>
  );
}
