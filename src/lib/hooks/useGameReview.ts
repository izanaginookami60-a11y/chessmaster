"use client";

import { useCallback, useState } from "react";
import { stockfishEngine } from "@/lib/chess/stockfishEngine";
import {
  centipawnLoss,
  classifyMove,
  computeAccuracy,
  MATE_SCORE,
  type GameAccuracy,
  type MoveQuality,
} from "@/lib/chess/analysis";
import { replayMoves, START_FEN } from "@/lib/chess/pgn";
import { uciToSan } from "@/lib/chess/uci";

export interface ReviewedMove {
  ply: number; // 0-based index into the move list
  san: string;
  color: "w" | "b";
  cpBefore: number;
  cpAfter: number;
  loss: number;
  quality: MoveQuality;
  bestSan: string | null;
}

interface UseGameReviewOptions {
  moves: string[]; // SAN
  startFen?: string;
  depth?: number;
  moveTimeMs?: number;
}

/**
 * Run the engine over every position of a finished game, score each move
 * and produce per-side accuracy. Runs sequentially (one worker) and
 * reports progress so the UI can show a bar.
 */
export function useGameReview({
  moves,
  startFen = START_FEN,
  depth = 12,
  moveTimeMs = 600,
}: UseGameReviewOptions) {
  const [review, setReview] = useState<ReviewedMove[] | null>(null);
  const [accuracy, setAccuracy] = useState<GameAccuracy | null>(null);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async () => {
    setRunning(true);
    setError(null);
    setReview(null);
    setAccuracy(null);

    try {
      const { entries } = replayMoves(moves, startFen);
      const fens = [startFen, ...entries.map((e) => e.fen)];
      setProgress({ done: 0, total: fens.length });

      const evals: Array<{ cp: number; best: string | null }> = [];
      for (let i = 0; i < fens.length; i++) {
        const analysis = await stockfishEngine.analyse(fens[i], {
          depth,
          moveTimeMs,
        });
        evals.push({
          cp:
            analysis?.mate !== null && analysis?.mate !== undefined
              ? analysis.mate > 0
                ? MATE_SCORE
                : -MATE_SCORE
              : analysis?.cp ?? 0,
          best: analysis?.bestMove ?? null,
        });
        setProgress({ done: i + 1, total: fens.length });
      }

      const results: ReviewedMove[] = entries.map((entry, index) => {
        const before = evals[index];
        const after = evals[index + 1];
        const loss = centipawnLoss(before.cp, after.cp, entry.color);
        const bestSan = before.best ? uciToSan(fens[index], before.best) : null;
        const quality: MoveQuality =
          bestSan && entry.san === bestSan ? "best" : classifyMove(loss, false);

        return {
          ply: index,
          san: entry.san,
          color: entry.color,
          cpBefore: before.cp,
          cpAfter: after.cp,
          loss,
          quality,
          bestSan,
        };
      });

      setReview(results);
      setAccuracy(
        computeAccuracy(results.map((r) => ({ loss: r.loss, mover: r.color })))
      );
    } catch {
      setError("Analysis failed — the engine could not be loaded.");
    } finally {
      setRunning(false);
    }
  }, [moves, startFen, depth, moveTimeMs]);

  const reset = useCallback(() => {
    setReview(null);
    setAccuracy(null);
    setProgress({ done: 0, total: 0 });
    setError(null);
  }, []);

  return { review, accuracy, progress, running, error, run, reset };
}
