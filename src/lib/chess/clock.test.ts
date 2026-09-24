import { describe, expect, it } from "vitest";
import {
  createClock,
  defaultIncrement,
  formatClock,
  parseTimeControl,
  switchTurn,
  tick,
} from "./clock";

describe("createClock", () => {
  it("gives both sides the full starting time", () => {
    const state = createClock({ initialMs: 60_000, incrementMs: 0 }, "w");

    expect(state.whiteMs).toBe(60_000);
    expect(state.blackMs).toBe(60_000);
    expect(state.active).toBe("w");
    expect(state.running).toBe(false);
  });
});

describe("tick", () => {
  it("subtracts elapsed time from the active side", () => {
    const next = tick(
      { whiteMs: 60_000, blackMs: 60_000, active: "w", running: true },
      500
    );

    expect(next.state.whiteMs).toBe(59_500);
    expect(next.state.blackMs).toBe(60_000);
    expect(next.flagged).toBeNull();
  });

  it("flags a side that runs out of time", () => {
    const next = tick(
      { whiteMs: 500, blackMs: 60_000, active: "w", running: true },
      1_000
    );

    expect(next.state.whiteMs).toBe(0);
    expect(next.state.running).toBe(false);
    expect(next.flagged).toBe("w");
  });

  it("leaves a paused clock untouched", () => {
    const start = { whiteMs: 60_000, blackMs: 60_000, active: "w" as const, running: false };
    const next = tick(start, 1_000);

    expect(next.state).toEqual(start);
    expect(next.flagged).toBeNull();
  });
});

describe("switchTurn", () => {
  it("adds the increment and swaps the active side", () => {
    const next = switchTurn(
      { whiteMs: 50_000, blackMs: 60_000, active: "w", running: true },
      { initialMs: 60_000, incrementMs: 2_000 }
    );

    expect(next.whiteMs).toBe(52_000);
    expect(next.active).toBe("b");
    expect(next.running).toBe(true);
  });
});

describe("formatClock", () => {
  it("renders minutes and seconds", () => {
    expect(formatClock(600_000)).toBe("10:00");
    expect(formatClock(65_000)).toBe("1:05");
  });

  it("adds tenths under the low-time threshold", () => {
    expect(formatClock(9_450)).toBe("0:09.4");
  });
});

describe("parseTimeControl", () => {
  it("returns null for unlimited or invalid values", () => {
    expect(parseTimeControl(null)).toBeNull();
    expect(parseTimeControl("unlimited")).toBeNull();
    expect(parseTimeControl("nope")).toBeNull();
  });

  it("converts seconds to milliseconds with the default increment", () => {
    expect(parseTimeControl("300")).toEqual({ initialMs: 300_000, incrementMs: 3_000 });
  });
});

describe("defaultIncrement", () => {
  it("gives bullet games no increment", () => {
    expect(defaultIncrement(60)).toBe(0);
  });

  it("gives longer games a larger increment", () => {
    expect(defaultIncrement(300)).toBe(3_000);
    expect(defaultIncrement(1_800)).toBe(5_000);
  });
});
