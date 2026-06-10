import { describe, expect, it } from "vitest";
import { evaluateOpenNow } from "./openNow";

const FSU = { lat: 30.4419, lon: -84.2985 };
const lateNiteSat = new Date(2026, 5, 13, 1, 30);

describe("evaluateOpenNow", () => {
  it("treats 24/7 as open with no close time", () => {
    const state = evaluateOpenNow("24/7", lateNiteSat, FSU);
    expect(state).toEqual({ status: "open", closesAt: null, closesInMin: null });
  });

  it("handles hours that span midnight (the late-nite case)", () => {
    const state = evaluateOpenNow("Fr 22:00-02:00", lateNiteSat, FSU);
    expect(state.status).toBe("open");
    if (state.status === "open") {
      expect(state.closesInMin).toBe(30);
    }
  });

  it("is closed outside listed hours, with the next open time", () => {
    const state = evaluateOpenNow("Mo-Fr 09:00-17:00", lateNiteSat, FSU);
    expect(state.status).toBe("closed");
    if (state.status === "closed") {
      expect(state.opensAt).not.toBeNull();
    }
  });

  it("is honest about missing hours", () => {
    const state = evaluateOpenNow(undefined, lateNiteSat, FSU);
    expect(state).toEqual({ status: "unknown", reason: "no hours in OSM" });
  });

  it("is honest about unparseable hours", () => {
    const state = evaluateOpenNow("ask jeff", lateNiteSat, FSU);
    expect(state.status).toBe("unknown");
  });
});
