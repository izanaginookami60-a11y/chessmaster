import type { ReactNode } from "react";

interface PlayerInfoBarProps {
  avatar: ReactNode;
  name: string;
  rating: number | string;
  isThinking?: boolean;
  thinkingIndicator?: ReactNode;
  align?: "left" | "right";
  /** Optional slot on the far right (used for the clock). */
  clock?: ReactNode;
}

export function PlayerInfoBar({
  avatar,
  name,
  rating,
  thinkingIndicator,
  clock,
}: PlayerInfoBarProps) {
  return (
    <div className="flex items-center gap-3 bg-bg-secondary rounded-lg px-3 py-2">
      {avatar}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-text-primary truncate flex items-center">
          {name}
          {thinkingIndicator}
        </p>
        <p className="text-xs text-text-secondary">{rating}</p>
      </div>
      {clock}
    </div>
  );
}

