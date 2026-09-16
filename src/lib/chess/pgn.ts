"use client";

import { Chess } from "chess.js";
import type { MoveHistoryEntry } from "./types";

export const START_FEN =
  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

export interface ParsedPgn {
  ok: boolean;
  error?: string;
  moves: string[]; // SAN list
  startFen: string;
  headers: Record<string, string>;
  result?: string;
}

/**
 * Validate a PGN string and extract the move list in SAN form.
 * chess.js replays the moves internally, so a bad PGN is rejected.
 */
export function parsePgn(pgn: string): ParsedPgn {
  const game = new Chess();
  try {
    game.loadPgn(pgn.trim());
  } catch (err) {
    return {
      ok: false,
      error: (err as Error).message || "Could not parse that PGN.",
      moves: [],
      startFen: START_FEN,
      headers: {},
    };
  }

  const headers = game.getHeaders() as Record<string, string>;
  const moves = parseSanList(validatedHistory(game));
  const startFen = headers.SetUp === "1" && headers.FEN ? headers.FEN : START_FEN;

  return {
    ok: true,
    moves,
    startFen,
    headers,
    result: headers.Result ?? undefined,
  };
}

/** Split a PGN move-text blob into individual SAN tokens. */
export function parseSanList(pgnMoveText: string): string[] {
  return pgnMoveText
    .replace(/\{[^}]*\}/g, " ") // comments
    .replace(/;[^\n]*/g, " ") // line comments
    .replace(/\([^)]*\)/g, " ") // variations
    .replace(/\d+\.(\.\.)?/g, " ") // move numbers
    .replace(/(1-0|0-1|1\/2-1\/2|\*)/g, " ") // results
    .replace(/[?!]+/g, "")
    .split(/\s+/)
    .filter(Boolean);
}

function validatedHistory(game: Chess): string {
  return game.history().join(" ");
}

export interface BuildPgnParams {
  moves: string[]; // SAN
  startFen?: string;
  white: string;
  black: string;
  result?: "1-0" | "0-1" | "1/2-1/2" | "*";
  event?: string;
  date?: string;
}

/** Build a PGN string from a SAN move list (and optional headers). */
export function buildPgn({
  moves,
  startFen,
  white,
  black,
  result = "*",
  event = "ChessMaster",
  date,
}: BuildPgnParams): string {
  const game = new Chess(startFen && startFen !== START_FEN ? startFen : undefined);

  for (const san of moves) {
    try {
      game.move(san);
    } catch {
      // Stop at the first move that doesn't parse; the PGN stays valid
      // up to that point rather than throwing.
      break;
    }
  }

  game.setHeader("Event", event);
  game.setHeader("Site", "ChessMaster");
  game.setHeader("Date", date ?? new Date().toISOString().slice(0, 10));
  game.setHeader("White", white);
  game.setHeader("Black", black);
  game.setHeader("Result", result);
  if (startFen && startFen !== START_FEN) {
    game.setHeader("SetUp", "1");
    game.setHeader("FEN", startFen);
  }

  return game.pgn();
}

export interface ReplayState {
  entries: MoveHistoryEntry[];
  finalFen: string;
}

/**
 * Replay a SAN move list from a starting position, producing the same
 * history entries the live board uses (so the move list, highlights and
 * material display all work in replay/analysis views).
 */
export function replayMoves(
  moves: string[],
  startFen: string = START_FEN
): ReplayState {
  const game = new Chess(startFen === START_FEN ? undefined : startFen);
  const entries: MoveHistoryEntry[] = [];

  for (const san of moves) {
    let move;
    try {
      move = game.move(san);
    } catch {
      break;
    }
    if (!move) break;

    entries.push({
      san: move.san,
      fen: game.fen(),
      moveNumber: game.moveNumber(),
      color: move.color,
      captured: move.captured,
      from: move.from,
      to: move.to,
      isCheck: game.inCheck(),
      isCheckmate: game.isCheckmate(),
      isCastle: move.flags.includes("k") || move.flags.includes("q"),
      isPromotion: !!move.promotion,
    });
  }

  return { entries, finalFen: game.fen() };
}
