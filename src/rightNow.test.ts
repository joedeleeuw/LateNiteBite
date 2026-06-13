import { describe, expect, it } from "vitest";
import type { RankedSpot } from "@/core/rank";
import {
  FALLBACK_PLACES,
  bboxForCoordinates,
  buildNavigateUrl,
  formatDistance,
  formatHeadline,
  openStateTextClass,
  parseRankedSpotParam,
  serializeRankedSpot,
  spotQueryKey,
} from "./rightNow";
import { buildRightNowBody, openSpotRows } from "./rightNowScreen";

const sampleRanked: RankedSpot = {
  spot: {
    id: "node/1",
    name: "Joe's Pizza",
    amenity: "fast_food",
    coordinates: { lat: 40.73, lon: -73.99 },
    openingHours: "Mo-Su 11:00-04:00",
    cuisine: "pizza",
    phone: "+1 555 0100",
    website: "example.com",
  },
  distanceMi: 0.2,
  state: {
    status: "open",
    closesAt: new Date("2026-06-13T06:08:00.000Z"),
    closesInMin: 38,
  },
};

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

  it("maps open state to the open text class", () => {
    expect(
      openStateTextClass({
        status: "open",
        closesAt: null,
        closesInMin: null,
      }),
    ).toBe("text-lnb-open");
    expect(
      openStateTextClass({ status: "closed", opensAt: null }),
    ).toBe("text-lnb-muted");
  });

  it("round-trips ranked spot route params", () => {
    const serialized = serializeRankedSpot(sampleRanked);
    const parsed = parseRankedSpotParam(serialized);

    expect(parsed?.spot.id).toBe(sampleRanked.spot.id);
    expect(parsed?.distanceMi).toBe(sampleRanked.distanceMi);
    expect(parsed?.state.status).toBe("open");
    if (parsed?.state.status === "open") {
      expect(parsed.state.closesInMin).toBe(38);
      expect(parsed.state.closesAt?.toISOString()).toBe(
        sampleRanked.state.status === "open"
          ? sampleRanked.state.closesAt?.toISOString()
          : undefined,
      );
    }
  });
});

describe("right now screen model", () => {
  it("filters open rows once", () => {
    const ranked: RankedSpot[] = [
      sampleRanked,
      {
        ...sampleRanked,
        spot: { ...sampleRanked.spot, id: "node/2", name: "Closed Spot" },
        state: { status: "closed", opensAt: new Date("2026-06-13T08:00:00.000Z") },
      },
    ];

    expect(openSpotRows(ranked)).toHaveLength(1);
    expect(openSpotRows(ranked)[0]?.ranked.spot.name).toBe("Joe's Pizza");
  });

  it("aligns body kind with location flow phase", () => {
    const denied = buildRightNowBody(
      { phase: "denied", note: "location denied. pick a place." },
      { isError: false, isPending: false } as never,
      [],
      () => undefined,
    );
    expect(denied?.kind).toBe("pick-place");

    const readyLoading = buildRightNowBody(
      {
        phase: "ready",
        choice: { label: "near you", coordinates: { lat: 1, lon: 2 } },
      },
      { isError: false, isPending: true } as never,
      [],
      () => undefined,
    );
    expect(readyLoading?.kind).toBe("spots-loading");
  });
});
