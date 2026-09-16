"use client";

import type { Square } from "chess.js";
import type { BoardArrow } from "@/lib/chess/types";

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];

const ARROW_COLOR_HEX: Record<BoardArrow["color"], string> = {
  green: "#15781b",
  red: "#e8393b",
  blue: "#0e6bb8",
  yellow: "#e6b800",
};

function squareToCenter(
  square: Square,
  boardSize: number,
  orientation: "white" | "black"
): { x: number; y: number } {
  const file = FILES.indexOf(square[0]);
  const rank = parseInt(square[1], 10) - 1;
  const cell = boardSize / 8;

  const col = orientation === "white" ? file : 7 - file;
  const row = orientation === "white" ? 7 - rank : rank;

  return { x: col * cell + cell / 2, y: row * cell + cell / 2 };
}

interface ArrowOverlayProps {
  arrows: BoardArrow[];
  boardSize: number;
  orientation: "white" | "black";
}

export function ArrowOverlay({
  arrows,
  boardSize,
  orientation,
}: ArrowOverlayProps) {
  if (arrows.length === 0) return null;

  return (
    <svg
      className="absolute inset-0 pointer-events-none z-20"
      width={boardSize}
      height={boardSize}
      viewBox={`0 0 ${boardSize} ${boardSize}`}
    >
      <defs>
        {Object.entries(ARROW_COLOR_HEX).map(([name, hex]) => (
          <marker
            key={name}
            id={`arrowhead-${name}`}
            markerWidth="4"
            markerHeight="4"
            refX="2"
            refY="2"
            orient="auto"
          >
            <path d="M0,0 L4,2 L0,4 Z" fill={hex} />
          </marker>
        ))}
      </defs>

      {arrows.map((arrow, i) => {
        const from = squareToCenter(arrow.from, boardSize, orientation);
        const to = squareToCenter(arrow.to, boardSize, orientation);
        // Shorten the line slightly so the arrowhead doesn't overlap the
        // destination square's piece too heavily.
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const len = Math.hypot(dx, dy) || 1;
        const shorten = boardSize / 8 / 2.4;
        const endX = to.x - (dx / len) * shorten;
        const endY = to.y - (dy / len) * shorten;

        return (
          <line
            key={i}
            x1={from.x}
            y1={from.y}
            x2={endX}
            y2={endY}
            stroke={ARROW_COLOR_HEX[arrow.color]}
            strokeWidth={boardSize / 8 / 6}
            strokeLinecap="round"
            opacity={0.85}
            markerEnd={`url(#arrowhead-${arrow.color})`}
          />
        );
      })}
    </svg>
  );
}
