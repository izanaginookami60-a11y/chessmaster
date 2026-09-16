"use client";

import { useEffect, useRef } from "react";
import type { MoveHistoryEntry } from "@/lib/chess/types";

interface MoveListProps {
  history: MoveHistoryEntry[];
  /** Index into history of the position currently being viewed.
   *  -1 means "starting position" (before any move). */
  viewIndex: number;
  onNavigate: (index: number) => void;
}

export function MoveList({ history, viewIndex, onNavigate }: MoveListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  // Keyboard navigation: left/right arrows step through moves,
  // home/end jump to start/latest.
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      // Don't hijack arrow keys while typing in an input/textarea
      if (["INPUT", "TEXTAREA"].includes(target.tagName)) return;

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        onNavigate(Math.max(-1, viewIndex - 1));
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        onNavigate(Math.min(history.length - 1, viewIndex + 1));
      } else if (e.key === "Home") {
        e.preventDefault();
        onNavigate(-1);
      } else if (e.key === "End") {
        e.preventDefault();
        onNavigate(history.length - 1);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [viewIndex, history.length, onNavigate]);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest" });
  }, [viewIndex]);

  // Group into pairs of (white move, black move) for classic notation rows
  const rows: Array<{
    moveNumber: number;
    white?: MoveHistoryEntry;
    whiteIndex?: number;
    black?: MoveHistoryEntry;
    blackIndex?: number;
  }> = [];

  history.forEach((entry, i) => {
    if (entry.color === "w") {
      rows.push({ moveNumber: rows.length + 1, white: entry, whiteIndex: i });
    } else {
      const last = rows[rows.length - 1];
      if (last && !last.black) {
        last.black = entry;
        last.blackIndex = i;
      } else {
        rows.push({ moveNumber: rows.length + 1, black: entry, blackIndex: i });
      }
    }
  });

  return (
    <div
      ref={containerRef}
      className="bg-bg-secondary rounded-lg overflow-y-auto max-h-80 text-sm"
    >
      {history.length === 0 ? (
        <p className="text-text-secondary text-xs p-3">
          Moves will appear here once the game starts.
        </p>
      ) : (
        <table className="w-full">
          <tbody>
            {rows.map((row) => (
              <tr key={row.moveNumber} className="odd:bg-bg-tertiary/40">
                <td className="text-text-secondary text-xs w-8 pl-2 py-1">
                  {row.moveNumber}.
                </td>
                <td className="py-1">
                  {row.white && (
                    <button
                      ref={viewIndex === row.whiteIndex ? activeRef : undefined}
                      onClick={() => onNavigate(row.whiteIndex!)}
                      className={`px-2 py-0.5 rounded ${
                        viewIndex === row.whiteIndex
                          ? "bg-accent-primary/20 text-accent-primary font-semibold"
                          : "text-text-primary hover:bg-bg-hover"
                      }`}
                    >
                      {row.white.san}
                    </button>
                  )}
                </td>
                <td className="py-1">
                  {row.black && (
                    <button
                      ref={viewIndex === row.blackIndex ? activeRef : undefined}
                      onClick={() => onNavigate(row.blackIndex!)}
                      className={`px-2 py-0.5 rounded ${
                        viewIndex === row.blackIndex
                          ? "bg-accent-primary/20 text-accent-primary font-semibold"
                          : "text-text-primary hover:bg-bg-hover"
                      }`}
                    >
                      {row.black.san}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
