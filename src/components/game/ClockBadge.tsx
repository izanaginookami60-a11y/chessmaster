"use client";

import { formatClock, LOW_TIME_THRESHOLD_MS } from "@/lib/chess/clock";

export function ClockBadge({
  ms,
  active,
  className,
}: {
  ms: number;
  active: boolean;
  className?: string;
}) {
  const low = ms <= LOW_TIME_THRESHOLD_MS;

  return (
    <span
      className={`inline-flex items-center tabular-nums font-mono text-sm px-2.5 py-1 rounded-lg ${
        active
          ? low
            ? "bg-result-loss/20 text-result-loss"
            : "bg-bg-primary text-text-primary"
          : "bg-bg-primary/60 text-text-secondary"
      } ${className ?? ""}`}
      aria-label={`${formatClock(ms)} remaining`}
    >
      {formatClock(ms)}
    </span>
  );
}
