import { describe, expect, it } from "vitest";
import { floorToMinute, millisecondsUntilNextMinute } from "./minute-clock";

describe("minute clock", () => {
  it("floors dates to minute precision", () => {
    expect(
      floorToMinute(new Date("2026-06-13T04:05:59.999Z")).toISOString(),
    ).toBe("2026-06-13T04:05:00.000Z");
  });

  it("calculates the delay until the next minute boundary", () => {
    expect(millisecondsUntilNextMinute(1_234)).toBe(58_766);
    expect(millisecondsUntilNextMinute(60_000)).toBe(60_000);
  });
});
