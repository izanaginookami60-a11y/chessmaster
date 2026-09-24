import { describe, expect, it } from "vitest";
import { uciListToSan, uciToSan } from "./uci";
import { START_FEN } from "./pgn";

describe("uciToSan", () => {
  it("converts a legal UCI move to SAN", () => {
    expect(uciToSan(START_FEN, "e2e4")).toBe("e4");
  });

  it("returns null for illegal moves", () => {
    expect(uciToSan(START_FEN, "e2e5")).toBeNull();
  });
});

describe("uciListToSan", () => {
  it("converts a principal variation to SAN", () => {
    expect(uciListToSan(START_FEN, ["e2e4", "e7e5", "g1f3"])).toEqual([
      "e4",
      "e5",
      "Nf3",
    ]);
  });

  it("stops at the first move that no longer fits", () => {
    expect(uciListToSan(START_FEN, ["e2e4", "b8b9"])).toEqual(["e4"]);
  });
});
