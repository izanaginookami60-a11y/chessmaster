import { describe, expect, it } from "vitest";
import {
  applyElo,
  bucketForTimeControl,
  expectedScore,
  isRateableUserId,
  kFactor,
  resultToPgn,
  scoreFor,
} from "./rating";

describe("bucketForTimeControl", () => {
  it("classifies bullet, blitz and rapid by base time", () => {
    expect(bucketForTimeControl(null)).toBe("rapid");
    expect(bucketForTimeControl(60)).toBe("bullet");
    expect(bucketForTimeControl(120)).toBe("bullet");
    expect(bucketForTimeControl(180)).toBe("blitz");
    expect(bucketForTimeControl(600)).toBe("blitz");
    expect(bucketForTimeControl(900)).toBe("rapid");
  });
});

describe("kFactor", () => {
  it("is higher for provisional players", () => {
    expect(kFactor(1200, 5)).toBe(40);
  });

  it("drops for established masters", () => {
    expect(kFactor(2500, 200)).toBe(20);
  });

  it("uses the standard value otherwise", () => {
    expect(kFactor(1500, 100)).toBe(24);
  });
});

describe("expectedScore", () => {
  it("gives even odds for equal ratings", () => {
    expect(expectedScore(1500, 1500)).toBeCloseTo(0.5, 5);
  });

  it("favours the higher rated player", () => {
    expect(expectedScore(1900, 1500)).toBeGreaterThan(0.9);
    expect(expectedScore(1500, 1900)).toBeLessThan(0.1);
  });
});

describe("scoreFor", () => {
  it("maps outcomes to scores", () => {
    expect(scoreFor("white", "white")).toBe(1);
    expect(scoreFor("white", "black")).toBe(0);
    expect(scoreFor("black", "draw")).toBe(0.5);
  });
});

describe("applyElo", () => {
  it("transfers points from loser to winner with equal K-factors", () => {
    const update = applyElo(
      { white: 1500, black: 1500 },
      "white",
      { white: 100, black: 100 }
    );

    expect(update.white).toBeGreaterThan(1500);
    expect(update.black).toBeLessThan(1500);
    expect(update.whiteDelta).toBe(-update.blackDelta);
  });

  it("keeps draws mostly unchanged for even players", () => {
    const update = applyElo(
      { white: 1500, black: 1500 },
      "draw",
      { white: 100, black: 100 }
    );

    expect(update.whiteDelta).toBe(0);
    expect(update.blackDelta).toBe(0);
  });

  it("never drops a rating below 100", () => {
    const update = applyElo(
      { white: 105, black: 2400 },
      "black",
      { white: 100, black: 100 }
    );

    expect(update.white).toBeGreaterThanOrEqual(100);
  });
});

describe("resultToPgn", () => {
  it("maps outcomes to PGN result strings", () => {
    expect(resultToPgn("white")).toBe("1-0");
    expect(resultToPgn("black")).toBe("0-1");
    expect(resultToPgn("draw")).toBe("1/2-1/2");
  });
});

describe("isRateableUserId", () => {
  it("rejects guests, bots and missing ids", () => {
    expect(isRateableUserId(null)).toBe(false);
    expect(isRateableUserId(undefined)).toBe(false);
    expect(isRateableUserId("guest")).toBe(false);
    expect(isRateableUserId("bot_easy")).toBe(false);
  });

  it("accepts real account ids", () => {
    expect(isRateableUserId("abc123")).toBe(true);
  });
});
