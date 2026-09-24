import { describe, expect, it } from "vitest";
import { Chess } from "chess.js";
import { isSameSquare, tryMove } from "./game";

describe("tryMove", () => {
  it("applies a legal move", () => {
    const game = new Chess();
    const move = tryMove(game, "e2", "e4");

    expect(move?.san).toBe("e4");
    expect(game.fen()).toContain("4P3");
  });

  it("returns null instead of throwing on an illegal move", () => {
    const game = new Chess();

    expect(tryMove(game, "e2", "e5")).toBeNull();
    expect(game.fen()).toBe(new Chess().fen());
  });

  it("treats a same-square drop as a no-op (the react-chessboard case)", () => {
    const game = new Chess();

    expect(tryMove(game, "e5", "e5")).toBeNull();
    expect(game.moveNumber()).toBe(1);
  });

  it("does not throw when the mentioned square has no piece", () => {
    const game = new Chess();

    expect(tryMove(game, "e5", "e6")).toBeNull();
  });

  it("applies promotions and keeps the chosen piece", () => {
    const game = new Chess("8/P6k/8/8/8/8/7K/8 w - - 0 1");

    expect(tryMove(game, "a7", "a8")).toBeNull(); // promotion piece missing
    expect(tryMove(game, "a7", "a8", "q")?.san).toBe("a8=Q");
  });
});

describe("isSameSquare", () => {
  it("detects no-op drops and empty input", () => {
    expect(isSameSquare("e5", "e5")).toBe(true);
    expect(isSameSquare("e5", "e6")).toBe(false);
    expect(isSameSquare(null, "e6")).toBe(false);
    expect(isSameSquare("e5", null)).toBe(false);
  });
});
