import { describe, expect, it } from "vitest";
import { Chess } from "chess.js";
import { computeMaterial } from "./material";

describe("computeMaterial", () => {
  it("reports no captures in the starting position", () => {
    const info = computeMaterial(new Chess());

    expect(info.capturedByWhite).toEqual([]);
    expect(info.capturedByBlack).toEqual([]);
    expect(info.advantage).toBe(0);
  });

  it("tracks a capture and the material lead", () => {
    const game = new Chess();
    game.move("e4");
    game.move("d5");
    game.move("exd5");

    const info = computeMaterial(game);

    expect(info.capturedByWhite).toEqual(["p"]);
    expect(info.capturedByBlack).toEqual([]);
    expect(info.advantage).toBe(1);
  });
});
