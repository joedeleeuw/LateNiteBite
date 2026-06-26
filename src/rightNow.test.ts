import { describe, expect, it } from "vitest";
import {
  bboxForCoordinates,
  buildNavigateUrl,
  coordinatesFromParams,
  formatDistance,
  formatHeadline,
  formatCuisine,
  navigationPlatformFromOS,
  nextOpeningLabel,
  requestLocationPermission,
  rightNowRows,
  routeIdForSpotId,
  spotDetailRouteFromParams,
  spotIdForRouteId,
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
      "hours unknown",
    );
  });

  it("formats walkable distances", () => {
    expect(formatDistance(0.37)).toBe("0.4 mi");
    expect(formatDistance(0.04)).toBe("211 ft");
  });

  it("formats OpenStreetMap cuisine tokens for humans", () => {
    expect(
      formatCuisine({
        id: "node/1",
        name: "sweet shop",
        amenity: "cafe",
        coordinates: { lat: 30.4419, lon: -84.2985 },
        cuisine: "breakfast;coffee_shop;hot_dog",
      }),
    ).toBe("breakfast · coffee shop · hot dog");
  });

  it("builds platform navigation urls", () => {
    const spot = {
      id: "node/1",
      name: "guthrie's",
      amenity: "restaurant",
      coordinates: { lat: 30.4419, lon: -84.2985 },
    } as const;

    expect(buildNavigateUrl(spot, "ios")).toBe(
      "https://maps.apple.com/?daddr=30.4419,-84.2985",
    );
    expect(buildNavigateUrl(spot, "android")).toBe(
      "geo:30.4419,-84.2985?q=30.4419%2C-84.2985(guthrie's)",
    );
    expect(buildNavigateUrl(spot, "web")).toBe(
      "https://www.google.com/maps/dir/?api=1&destination=30.4419%2C-84.2985",
    );
  });

  it("rejects unsupported navigation platforms instead of guessing", () => {
    expect(() => navigationPlatformFromOS("native")).toThrow();
  });

  it("round-trips route ids without storing spot details globally", () => {
    const routeId = routeIdForSpotId("way/12345");

    expect(routeId).toBe("way~2F12345");
    expect(spotIdForRouteId(routeId)).toBe("way/12345");
  });

  it("round-trips route ids with escape-marker characters", () => {
    const routeId = routeIdForSpotId("node/tilde~id");

    expect(routeId).toBe("node~2Ftilde~7Eid");
    expect(spotIdForRouteId(routeId)).toBe("node/tilde~id");
    expect(() => spotIdForRouteId("node~ZZbad")).toThrow(
      "Invalid spot route id",
    );
  });

  it("parses rounded coordinates from route params", () => {
    expect(coordinatesFromParams({ lat: "30.44194", lon: "-84.29854" })).toEqual({
      lat: 30.4419,
      lon: -84.2985,
    });
    expect(() =>
      coordinatesFromParams({ lat: "nope", lon: "-84.29854" }),
    ).toThrow("Invalid spot coordinates");
  });

  it("parses spot detail route params once into typed values", () => {
    expect(
      spotDetailRouteFromParams({
        id: routeIdForSpotId("way/12345"),
        lat: "30.44194",
        lon: "-84.29854",
      }),
    ).toEqual({
      coordinates: { lat: 30.4419, lon: -84.2985 },
      spotId: "way/12345",
    });

    expect(() =>
      spotDetailRouteFromParams({
        id: routeIdForSpotId("way/12345"),
        lat: "30.44194",
      }),
    ).toThrow("Invalid spot detail route params");

    expect(() =>
      spotDetailRouteFromParams({
        id: [routeIdForSpotId("way/12345"), routeIdForSpotId("node/67890")],
        lat: "30.44194",
        lon: "-84.29854",
      }),
    ).toThrow("Invalid spot detail route params");
  });

  it("derives next opening by soonest opening time instead of list order", () => {
    expect(
      nextOpeningLabel([
        {
          spot: {
            id: "node/1",
            name: "later slice",
            amenity: "fast_food",
            coordinates: { lat: 30.4419, lon: -84.2985 },
          },
          distanceMi: 0.1,
          state: {
            status: "closed",
            opensAt: new Date("2026-06-13T08:00:00.000Z"),
          },
        },
        {
          spot: {
            id: "node/2",
            name: "soon taco",
            amenity: "restaurant",
            coordinates: { lat: 30.442, lon: -84.299 },
          },
          distanceMi: 0.3,
          state: {
            status: "closed",
            opensAt: new Date("2026-06-13T07:00:00.000Z"),
          },
        },
      ]),
    ).toContain("soon taco");
  });

  it("keeps unknown spots in right now rows while excluding closed spots", () => {
    const coordinates = { lat: 30.4419, lon: -84.2985 };
    const rows = rightNowRows(
      [
        {
          spot: {
            id: "node/open",
            name: "open slice",
            amenity: "restaurant",
            coordinates,
          },
          distanceMi: 0.2,
          state: { status: "open", closesAt: null, closesInMin: null },
        },
        {
          spot: {
            id: "node/unknown",
            name: "maybe tacos",
            amenity: "fast_food",
            coordinates,
          },
          distanceMi: 0.3,
          state: { status: "unknown", reason: "no hours in OSM" },
        },
        {
          spot: {
            id: "node/closed",
            name: "closed cafe",
            amenity: "cafe",
            coordinates,
          },
          distanceMi: 0.1,
          state: { status: "closed", opensAt: null },
        },
      ],
      coordinates,
    );

    expect(rows.map((row) => row.ranked.spot.id)).toEqual([
      "node/open",
      "node/unknown",
    ]);
    expect(rows[1]).toMatchObject({
      routeId: "node~2Funknown",
      coordinates,
    });
  });

  it("returns an error result when the permission request throws", async () => {
    const error = new Error("permission API unavailable");

    await expect(
      requestLocationPermission(async () => {
        throw error;
      }),
    ).resolves.toEqual({ type: "error", error });
  });
});
