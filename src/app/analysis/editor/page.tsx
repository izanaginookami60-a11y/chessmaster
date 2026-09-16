"use client";

import { useMemo, useRef, useState } from "react";
import { Chess } from "chess.js";
import toast from "react-hot-toast";
import { ChessBoard } from "@/components/board/ChessBoard";
import { EnginePanel } from "@/components/analysis/EnginePanel";
import { useBoardWidth } from "@/lib/hooks/useBoardWidth";
import { START_FEN, buildPgn, parsePgn } from "@/lib/chess/pgn";
import type { ChessBoardHandle } from "@/lib/chess/types";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  FiCopy,
  FiDownload,
  FiRotateCcw,
  FiTrash2,
  FiUpload,
} from "react-icons/fi";

export default function AnalysisEditorPage() {
  const boardRef = useRef<ChessBoardHandle>(null);
  const boardWidth = useBoardWidth({ max: 520, padding: 340 });
  const [fen, setFen] = useState(START_FEN);
  const [loaded, setLoaded] = useState<{ fen: string; moves: string[] } | null>(
    null
  );
  const [pgnInput, setPgnInput] = useState("");
  const [fenInput, setFenInput] = useState("");

  // Remount the board whenever a different game/position is loaded.
  const boardKey = useMemo(
    () => `${loaded?.fen ?? "start"}:${loaded?.moves.length ?? 0}`,
    [loaded]
  );

  function isValidFen(candidate: string): string | null {
    try {
      return new Chess(candidate.trim()).fen();
    } catch {
      return null;
    }
  }

  function loadPgn() {
    const parsed = parsePgn(pgnInput);
    if (!parsed.ok) {
      toast.error(parsed.error ?? "That PGN could not be read.");
      return;
    }
    if (parsed.moves.length === 0) {
      toast.error("No moves found in that PGN.");
      return;
    }
    setLoaded({ fen: parsed.startFen, moves: parsed.moves });
    setFen(parsed.startFen);
    toast.success(`Loaded ${parsed.moves.length} moves.`);
  }

  function loadFen() {
    const validFen = isValidFen(fenInput);
    if (!validFen) {
      toast.error("That FEN is not a legal position.");
      return;
    }
    setLoaded({ fen: validFen, moves: [] });
    setFen(validFen);
    toast.success("Position loaded.");
  }

  function currentPgn() {
    return buildPgn({
      moves: loaded?.moves ?? [],
      startFen: loaded?.fen,
      white: "White",
      black: "Black",
    });
  }

  function copyPgn() {
    void navigator.clipboard
      .writeText(currentPgn())
      .then(() => toast.success("PGN copied."))
      .catch(() => toast.error("Could not access the clipboard."));
  }

  function downloadPgn() {
    const blob = new Blob([currentPgn()], { type: "application/x-chess-pgn" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "chessmaster-analysis.pgn";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <PageHeader
        title="Analysis board"
        description="Free play with the engine — both sides are movable from this device."
      />

      <div className="flex flex-col lg:flex-row gap-5">
        <div>
          <ChessBoard
            key={boardKey}
            ref={boardRef}
            initialFen={loaded?.fen}
            initialMoves={loaded?.moves}
            allowedColor="both"
            boardWidth={boardWidth}
            onMove={(_entry, fenAfter) => setFen(fenAfter)}
            onGameEnd={(result, reason) =>
              toast(`${result} by ${reason}`, { icon: "🏁" })
            }
          />
        </div>

        <div className="flex-1 min-w-0 space-y-3">
          <EnginePanel
            fen={fen}
            auto
            onPlayBestMove={(uci) =>
              boardRef.current?.makeMove(
                uci.slice(0, 2),
                uci.slice(2, 4),
                (uci[4] as "q" | "r" | "b" | "n" | undefined) ?? undefined
              )
            }
          />

          <div className="bg-bg-secondary rounded-xl p-4">
            <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2 mb-3">
              <FiUpload size={14} className="text-accent-primary" /> Load a game
            </h2>

            <textarea
              value={pgnInput}
              onChange={(e) => setPgnInput(e.target.value)}
              rows={4}
              placeholder="Paste PGN here, e.g. 1. e4 e5 2. Nf3 Nc6"
              className="w-full bg-bg-primary border border-bg-hover rounded-lg px-3 py-2 text-sm text-text-primary mb-2"
            />
            <button
              onClick={loadPgn}
              disabled={!pgnInput.trim()}
              className="text-xs font-medium bg-bg-primary hover:bg-bg-hover text-text-primary px-3 py-2 rounded-lg disabled:opacity-50"
            >
              Load PGN
            </button>

            <div className="flex gap-2 mt-4">
              <input
                value={fenInput}
                onChange={(e) => setFenInput(e.target.value)}
                placeholder="…or paste a FEN"
                className="flex-1 bg-bg-primary border border-bg-hover rounded-lg px-3 py-2 text-xs text-text-primary"
              />
              <button
                onClick={loadFen}
                disabled={!fenInput.trim()}
                className="text-xs font-medium bg-bg-primary hover:bg-bg-hover text-text-primary px-3 py-2 rounded-lg disabled:opacity-50"
              >
                Load
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => boardRef.current?.resetBoard()}
              className="inline-flex items-center gap-1.5 text-xs font-medium bg-bg-secondary hover:bg-bg-hover text-text-primary px-3 py-2 rounded-lg"
            >
              <FiTrash2 size={13} /> New game
            </button>
            <button
              onClick={() => boardRef.current?.undoMove()}
              className="inline-flex items-center gap-1.5 text-xs font-medium bg-bg-secondary hover:bg-bg-hover text-text-primary px-3 py-2 rounded-lg"
            >
              <FiRotateCcw size={13} /> Undo
            </button>
            <button
              onClick={() => {
                setLoaded(null);
                setFen(START_FEN);
              }}
              className="inline-flex items-center gap-1.5 text-xs font-medium bg-bg-secondary hover:bg-bg-hover text-text-primary px-3 py-2 rounded-lg"
            >
              Reset to start
            </button>
            <button
              onClick={copyPgn}
              className="inline-flex items-center gap-1.5 text-xs font-medium bg-bg-secondary hover:bg-bg-hover text-text-primary px-3 py-2 rounded-lg"
            >
              <FiCopy size={13} /> Copy PGN
            </button>
            <button
              onClick={downloadPgn}
              className="inline-flex items-center gap-1.5 text-xs font-medium bg-bg-secondary hover:bg-bg-hover text-text-primary px-3 py-2 rounded-lg"
            >
              <FiDownload size={13} /> Download
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

