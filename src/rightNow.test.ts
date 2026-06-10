import { describe, expect, it } from "vitest";
import {
  FALLBACK_PLACES,
  bboxForCoordinates,
  buildNavigateUrl,
  formatDistance,
  formatHeadline,
  spotQueryKey,
} from "./rightNow";

describe("right now glue", () => {
  it("builds the small overpass bbox around the chosen coordinates", () => {
    expect(bboxForCoordinates({ lat: 30.4419, lon: -84.2985 })).toEqual({
      south: 30.4219,
      west: -84.3235,
      north: 30.4619,
      east: -84.2735,
    });
  });

  it("uses rounded coordinates in the spot query key", () => {
    expect(spotQueryKey({ lat: 30.44194, lon: -84.29854 })).toEqual([
      "spots",
      { lat: 30.4419, lon: -84.2985 },
    ]);
  });

  it("formats honest open-now headlines", () => {
    expect(
      formatHeadline({
        status: "open",
        closesAt: new Date("2026-06-13T06:08:00.000Z"),
        closesInMin: 38,
      }),
    ).toBe("open · closes in 38m");
    expect(formatHeadline({ status: "closed", opensAt: null })).toBe("closed");
    expect(formatHeadline({ status: "unknown", reason: "no hours" })).toBe(
      "hours unknown — trust your gut",
    );
  });

  it("formats walkable distances", () => {
    expect(formatDistance(0.37)).toBe("0.4 mi");
    expect(formatDistance(0.04)).toBe("211 ft");
  });

  it("builds platform navigation urls", () => {
    const spot = {
      name: "guthrie's",
      coordinates: { lat: 30.4419, lon: -84.2985 },
    };

    expect(buildNavigateUrl(spot, "ios")).toBe(
      "https://maps.apple.com/?daddr=30.4419,-84.2985",
    );
    expect(buildNavigateUrl(spot, "android")).toBe(
      "geo:30.4419,-84.2985?q=30.4419,-84.2985(guthrie's)",
    );
    expect(buildNavigateUrl(spot, "web")).toBe(
      "https://www.google.com/maps/dir/?api=1&destination=30.4419%2C-84.2985",
    );
  });

  it("keeps the fallback launch cities in memory-safe state shape", () => {
    expect(FALLBACK_PLACES.map((place) => place.label)).toEqual([
      "tallahassee · fsu",
      "nyc · washington sq",
    ]);
  });
});
