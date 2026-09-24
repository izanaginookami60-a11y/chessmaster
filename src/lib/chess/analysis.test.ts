import { describe, expect, it } from "vitest";
import {
  centipawnLoss,
  classifyMove,
  computeAccuracy,
  evalToWinProbability,
  formatEval,
  MATE_SCORE,
} from "./analysis";

describe("formatEval", () => {
  it("formats centipawn scores as pawns", () => {
    expect(formatEval(0)).toBe("0.00");
    expect(formatEval(150)).toBe("+1.50");
    expect(formatEval(-45)).toBe("-0.45");
  });

  it("formats mates", () => {
    expect(formatEval(0, 3)).toBe("#+3");
    expect(formatEval(0, -2)).toBe("#-2");
  });
});

describe("evalToWinProbability", () => {
  it("is 50% for an equal position", () => {
    expect(evalToWinProbability(0)).toBeCloseTo(0.5, 5);
  });

  it("approaches the extremes for decisive scores", () => {
    expect(evalToWinProbability(MATE_SCORE)).toBeGreaterThan(0.99);
    expect(evalToWinProbability(-MATE_SCORE)).toBeLessThan(0.01);
  });
});

describe("centipawnLoss", () => {
  it("measures what White gave away", () => {
    expect(centipawnLoss(100, -50, "w")).toBe(150);
  });

  it("measures what Black gave away", () => {
    expect(centipawnLoss(100, -50, "b")).toBe(0);
    expect(centipawnLoss(100, 200, "b")).toBe(100);
  });

  it("never reports a negative loss", () => {
    expect(centipawnLoss(100, 200, "w")).toBe(0);
  });
});

describe("classifyMove", () => {
  it("labels book moves first", () => {
    expect(classifyMove(500, true)).toBe("book");
  });

  it("uses loss thresholds otherwise", () => {
    expect(classifyMove(5, false)).toBe("best");
    expect(classifyMove(30, false)).toBe("good");
    expect(classifyMove(75, false)).toBe("inaccuracy");
    expect(classifyMove(150, false)).toBe("mistake");
    expect(classifyMove(400, false)).toBe("blunder");
  });
});

describe("computeAccuracy", () => {
  it("gives a perfect game 100%", () => {
    expect(computeAccuracy([])).toEqual({ white: 100, black: 100 });
    expect(
      computeAccuracy([
        { loss: 0, mover: "w" },
        { loss: 0, mover: "b" },
      ])
    ).toEqual({ white: 100, black: 100 });
  });

  it("punishes big blunders more than small slips", () => {
    const perfect = computeAccuracy([{ loss: 0, mover: "w" }]);
    const blundered = computeAccuracy([{ loss: 300, mover: "w" }]);

    expect(blundered.white).toBeLessThan(perfect.white);
    expect(blundered.black).toBe(100);
  });
});
