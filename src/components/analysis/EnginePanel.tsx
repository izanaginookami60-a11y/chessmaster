"use client";

import { useEffect, useState } from "react";
import { FiCpu, FiPlay, FiRefreshCw } from "react-icons/fi";
import {
  stockfishEngine,
  type EngineAnalysis,
} from "@/lib/chess/stockfishEngine";
import { formatSanLine, uciListToSan } from "@/lib/chess/uci";
import { formatEval } from "@/lib/chess/analysis";
import { EvalBar } from "./EvalBar";
import { Spinner } from "@/components/ui/Spinner";

interface EnginePanelProps {
  fen: string;
  /** Analyse automatically whenever the position changes. */
  auto?: boolean;
  depth?: number;
  moveTimeMs?: number;
  orientation?: "white" | "black";
  /** Show a button that plays the engine's suggested move on the board. */
  onPlayBestMove?: (uci: string) => void;
}

export function EnginePanel({
  fen,
  auto = false,
  depth = 14,
  moveTimeMs = 1200,
  orientation = "white",
  onPlayBestMove,
}: EnginePanelProps) {
  const [result, setResult] = useState<{
    fen: string;
    analysis: EngineAnalysis;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [manualRun, setManualRun] = useState(0);

  useEffect(() => {
    if (!auto) return;
    let cancelled = false;

    stockfishEngine
      .analyse(fen, { depth, moveTimeMs })
      .then((analysis) => {
        if (!cancelled && analysis) setResult({ fen, analysis });
      })
      .catch(() => {
        if (!cancelled) setError("The engine could not be loaded.");
      });

    return () => {
      cancelled = true;
    };
  }, [auto, fen, depth, moveTimeMs, manualRun]);

  const analysis = result && result.fen === fen ? result.analysis : null;
  const loading = auto && !analysis && !error;
  const pvSans = analysis ? uciListToSan(fen, analysis.pv) : [];

  return (
    <div className="bg-bg-secondary rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
          <FiCpu size={15} className="text-accent-primary" /> Engine
        </h2>
        <div className="flex items-center gap-2">
          {!auto && (
            <button
              onClick={() => setManualRun((n) => n + 1)}
              disabled={loading}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-text-secondary hover:text-text-primary disabled:opacity-50"
            >
              <FiRefreshCw size={12} /> Analyse
            </button>
          )}
          {analysis?.depth ? (
            <span className="text-[10px] text-text-muted">
              depth {analysis.depth}
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex gap-3">
        <EvalBar
          cp={analysis?.cp ?? 0}
          mate={analysis?.mate ?? null}
          orientation={orientation}
          height={160}
        />

        <div className="min-w-0 flex-1">
          {loading ? (
            <Spinner label="Thinking…" size={16} />
          ) : analysis ? (
            <>
              <p className="text-lg font-semibold text-text-primary">
                {formatEval(analysis.cp ?? 0, analysis.mate)}
              </p>
              {pvSans.length > 0 && (
                <p className="text-xs text-text-secondary mt-1 break-words">
                  {formatSanLine(fen, pvSans)}
                </p>
              )}
              {analysis.bestMove && onPlayBestMove && (
                <button
                  onClick={() => onPlayBestMove(analysis.bestMove as string)}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-accent-link mt-3"
                >
                  <FiPlay size={12} /> Play best move
                </button>
              )}
            </>
          ) : (
            <p className="text-xs text-text-secondary">
              {error ?? "Press Analyse to evaluate this position."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
