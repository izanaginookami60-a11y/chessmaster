"use client";

import { useMemo } from "react";
import { evalToWinProbability, formatEval } from "@/lib/chess/analysis";

/**
 * Vertical evaluation bar. `cp` is centipawns from White's point of view,
 * `mate` an optional mate distance (signed, White-positive).
 */
export function EvalBar({
  cp,
  mate,
  orientation = "white",
  height = 480,
}: {
  cp: number;
  mate?: number | null;
  orientation?: "white" | "black";
  height?: number;
}) {
  const whiteShare = useMemo(() => {
    if (mate !== undefined && mate !== null) {
      return mate > 0 ? 1 : 0;
    }
    return evalToWinProbability(cp);
  }, [cp, mate]);

  const whitePercent = Math.round(whiteShare * 1000) / 10;

  return (
    <div className="flex flex-col items-center gap-2 select-none">
      <div
        className="relative w-5 rounded overflow-hidden bg-[#403d39]"
        style={{ height }}
        role="meter"
        aria-label="Evaluation"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={whitePercent}
        aria-valuetext={formatEval(cp, mate ?? null)}
      >
        {/* Black fills from the top, white from the bottom. */}
        <div
          className={`absolute left-0 right-0 bg-[#f0f0f0] transition-[height] duration-300 ${
            orientation === "white" ? "bottom-0" : "top-0"
          }`}
          style={{ height: `${whitePercent}%` }}
        />
      </div>
      <span className="text-[10px] font-mono text-text-secondary">
        {formatEval(cp, mate ?? null)}
      </span>
    </div>
  );
}
