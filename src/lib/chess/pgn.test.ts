import { describe, expect, it } from "vitest";
import { Chess } from "chess.js";
import {
  buildPgn,
  parsePgn,
  parseSanList,
  replayMoves,
  START_FEN,
} from "./pgn";

describe("parseSanList", () => {
  it("strips move numbers, comments and results", () => {
    expect(parseSanList("1. e4 e5 2. Nf3 {a comment} (2... Nc6) 1-0")).toEqual([
      "e4",
      "e5",
      "Nf3",
    ]);
  });
});

describe("parsePgn", () => {
  it("extracts moves and headers from a valid game", () => {
    const parsed = parsePgn("1. e4 e5 2. Nf3 Nc6 3. Bb5 *");

    expect(parsed.ok).toBe(true);
    expect(parsed.moves).toEqual(["e4", "e5", "Nf3", "Nc6", "Bb5"]);
    expect(parsed.startFen).toBe(START_FEN);
  });

  it("rejects garbage with an error message", () => {
    const parsed = parsePgn("this is not a chess game");

    expect(parsed.ok).toBe(false);
    expect(parsed.error).toBeTruthy();
  });
});

describe("buildPgn", () => {
  it("round-trips through chess.js", () => {
    const moves = ["e4", "e5", "Nf3", "Nc6"];
    const pgn = buildPgn({ moves, white: "White", black: "Black" });

    const replay = new Chess();
    replay.loadPgn(pgn);
    expect(replay.history()).toEqual(moves);
    expect(replay.header().White).toBe("White");
  });
});

describe("replayMoves", () => {
  it("replays SAN moves into history entries", () => {
    const { entries, finalFen } = replayMoves(["e4", "e5"]);

    expect(entries).toHaveLength(2);
    expect(entries[0].from).toBe("e2");
    expect(entries[0].to).toBe("e4");
    expect(new Chess(finalFen).turn()).toBe("w");
  });

  it("stops at the first illegal move", () => {
    const { entries } = replayMoves(["e4", "Ke2"]);

    expect(entries).toHaveLength(1);
  });
});
