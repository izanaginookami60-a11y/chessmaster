import { describe, expect, it } from "vitest";
import {
  BUNDLED_PUZZLES,
  getDailyPuzzle,
  getPuzzleById,
  getRushSet,
  pickPuzzleForRating,
  puzzleRatingDelta,
} from "./index";

describe("BUNDLED_PUZZLES", () => {
  it("contains only puzzles already verified by scripts/verify-content.mjs", () => {
    expect(BUNDLED_PUZZLES.length).toBeGreaterThan(0);

    for (const puzzle of BUNDLED_PUZZLES) {
      expect(puzzle.id).toBeTruthy();
      expect(puzzle.fen).toBeTruthy();
      expect(puzzle.moves.length).toBeGreaterThan(0);
    }
  });
});

describe("getPuzzleById", () => {
  it("finds bundled puzzles by id", () => {
    expect(getPuzzleById(BUNDLED_PUZZLES[0].id)?.id).toBe(BUNDLED_PUZZLES[0].id);
  });

  it("returns undefined for unknown ids", () => {
    expect(getPuzzleById("no-such-puzzle")).toBeUndefined();
  });
});

describe("getDailyPuzzle", () => {
  it("is deterministic for the same day", () => {
    const day = new Date("2026-09-24T12:00:00Z");

    expect(getDailyPuzzle(day)).toEqual(getDailyPuzzle(day));
  });

  it("can change between days", () => {
    const ids = new Set(
      Array.from({ length: 30 }, (_, offset) =>
        getDailyPuzzle(new Date(Date.UTC(2026, 8, 1 + offset))).id
      )
    );

    expect(ids.size).toBeGreaterThan(1);
  });
});

describe("getRushSet", () => {
  it("returns the requested number of puzzles, easiest first", () => {
    const set = getRushSet(5);

    expect(set).toHaveLength(5);
    for (let index = 1; index < set.length; index += 1) {
      expect(set[index].rating).toBeGreaterThanOrEqual(
        set[index - 1].rating
      );
    }
  });
});

describe("pickPuzzleForRating", () => {
  it("picks a puzzle near the player's rating", () => {
    const puzzle = pickPuzzleForRating(800);

    expect(Math.abs(puzzle.rating - 800)).toBeLessThanOrEqual(200);
  });
});

describe("puzzleRatingDelta", () => {
  it("rewards solving and punishes missing", () => {
    expect(puzzleRatingDelta(1200, 1200, true, 20)).toBeGreaterThan(0);
    expect(puzzleRatingDelta(1200, 1200, false, 20)).toBeLessThan(0);
  });

  it("always moves the rating by at least one point", () => {
    expect(puzzleRatingDelta(3000, 700, true, 60)).toBeGreaterThanOrEqual(1);
    expect(puzzleRatingDelta(700, 3000, false, 60)).toBeLessThanOrEqual(-1);
  });

  it("gives quick solves a speed bonus", () => {
    expect(puzzleRatingDelta(1200, 1200, true, 5)).toBeGreaterThan(
      puzzleRatingDelta(1200, 1200, true, 60)
    );
  });
});
