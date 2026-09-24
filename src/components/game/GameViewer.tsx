"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { FiBarChart2, FiCopy, FiDownload } from "react-icons/fi";
import { ChessBoard } from "@/components/board/ChessBoard";
import { EnginePanel } from "@/components/analysis/EnginePanel";
import { GameReviewPanel } from "@/components/analysis/GameReviewPanel";
import { useBoardWidth } from "@/lib/hooks/useBoardWidth";
import { buildPgn, START_FEN } from "@/lib/chess/pgn";
import type { ChessBoardHandle } from "@/lib/chess/types";
import type { GameDocument } from "@/lib/firebase/games";
import { Skeleton } from "@/components/ui/Skeleton";

const RESULT_TEXT: Record<string, string> = {
  white: "White won",
  black: "Black won",
  draw: "Draw",
};

const PENDING_TEXT = "Game in progress";

export function GameViewer({
  game,
  analysisMode = false,
}: {
  game: GameDocument;
  analysisMode?: boolean;
}) {
  const boardRef = useRef<ChessBoardHandle>(null);
  const boardWidth = useBoardWidth({ max: 520 });
  const [engineOn, setEngineOn] = useState(analysisMode);
  const [fen, setFen] = useState(game.finalFen || START_FEN);

  const sans = game.moves.map((m) => m.san);
  const startFen = game.initialFen ?? START_FEN;

  function handleExportPgn() {
    const pgn = buildPgn({
      moves: sans,
      startFen,
      white: game.whiteName,
      black: game.blackName,
      result:
        game.result === "draw"
          ? "1/2-1/2"
          : game.result === "white"
          ? "1-0"
          : "0-1",
    });
    void navigator.clipboard
      .writeText(pgn)
      .then(() => toast.success("PGN copied to clipboard."))
      .catch(() => toast.error("Could not access the clipboard."));
  }

  function handleDownloadPgn() {
    const pgn = buildPgn({
      moves: sans,
      startFen,
      white: game.whiteName,
      black: game.blackName,
      result:
        game.result === "draw"
          ? "1/2-1/2"
          : game.result === "white"
          ? "1-0"
          : "0-1",
    });
    const blob = new Blob([pgn], { type: "application/x-chess-pgn" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `chessmaster-${game.id}.pgn`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4">
      <div>
        <div className="bg-bg-secondary rounded-xl p-3 mb-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-text-primary truncate">
              {game.blackName}
            </span>
            <span className="text-text-secondary text-xs">Black</span>
          </div>
          <div className="flex items-center justify-between text-sm mt-2">
            <span className="font-semibold text-text-primary truncate">
              {game.whiteName}
            </span>
            <span className="text-text-secondary text-xs">White</span>
          </div>
          <p className="text-xs text-text-secondary mt-3">
            {game.result ? RESULT_TEXT[game.result] : PENDING_TEXT} ·{" "}
            {game.reason}
            {game.rated ? " · rated" : ""}
          </p>
        </div>

        <ChessBoard
          ref={boardRef}
          initialFen={startFen}
          initialMoves={sans}
          boardWidth={boardWidth}
          allowedColor="both"
          readOnly={!analysisMode}
          onMove={(_entry, fenAfter) => setFen(fenAfter)}
        />

        <div className="flex flex-wrap items-center gap-2 mt-3">
          <button
            onClick={handleExportPgn}
            className="inline-flex items-center gap-1.5 text-xs font-medium bg-bg-secondary hover:bg-bg-hover text-text-primary px-3 py-2 rounded-lg"
          >
            <FiCopy size={13} /> Copy PGN
          </button>
          <button
            onClick={handleDownloadPgn}
            className="inline-flex items-center gap-1.5 text-xs font-medium bg-bg-secondary hover:bg-bg-hover text-text-primary px-3 py-2 rounded-lg"
          >
            <FiDownload size={13} /> Download PGN
          </button>
          {!analysisMode && (
            <Link
              href={`/analysis/${game.id}`}
              className="inline-flex items-center gap-1.5 text-xs font-medium bg-accent-primary text-bg-primary px-3 py-2 rounded-lg"
            >
              <FiBarChart2 size={13} /> Review this game
            </Link>
          )}
        </div>
      </div>

      <div className="flex-1 min-w-0 space-y-3">
        <EnginePanel
          fen={fen}
          auto={engineOn}
          onPlayBestMove={
            analysisMode
              ? (uci) =>
                  boardRef.current?.makeMove(
                    uci.slice(0, 2),
                    uci.slice(2, 4),
                    (uci[4] as "q" | "r" | "b" | "n" | undefined) ?? undefined
                  )
              : undefined
          }
        />
        {!analysisMode && (
          <button
            onClick={() => setEngineOn((v) => !v)}
            className="w-full text-xs font-medium bg-bg-secondary hover:bg-bg-hover text-text-primary py-2 rounded-lg"
          >
            {engineOn ? "Stop engine" : "Start engine analysis"}
          </button>
        )}

        {analysisMode && (
          <GameReviewPanel
            moves={sans}
            startFen={startFen}
            onSelectMove={(ply) => boardRef.current?.goToMove(ply)}
          />
        )}
      </div>
    </div>
  );
}

export function GameViewerSkeleton() {
  return (
    <div className="flex flex-col lg:flex-row gap-4">
      <div>
        <Skeleton className="h-24 w-full mb-3" />
        <Skeleton className="w-[480px] max-w-full aspect-square" />
      </div>
      <div className="flex-1">
        <Skeleton className="h-40 w-full" />
      </div>
    </div>
  );
}
