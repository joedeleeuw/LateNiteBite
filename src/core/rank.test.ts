import { describe, expect, it } from "vitest";
import { rankSpots } from "./rank";
import type { Spot } from "./spot";

const user = { lat: 30.4419, lon: -84.2985 };
const lateNiteSat = new Date(2026, 5, 13, 1, 30);

const spot = (
  id: string,
  lat: number,
  openingHours?: string,
): Spot => ({
  id,
  name: id,
  amenity: "restaurant",
  coordinates: { lat, lon: -84.2985 },
  openingHours,
});

describe("rankSpots", () => {
  it("ranks open before unknown before closed, then by distance", () => {
    const ranked = rankSpots(
      [
        spot("closed-nearest", 30.4421, "Mo-Fr 09:00-17:00"),
        spot("open-far", 30.46, "24/7"),
        spot("unknown-near", 30.4425),
        spot("open-near", 30.445, "24/7"),
      ],
      user,
      lateNiteSat,
    );

    expect(ranked.map((r) => r.spot.id)).toEqual([
      "open-near",
      "open-far",
      "unknown-near",
      "closed-nearest",
    ]);
    expect(ranked[0].distanceMi).toBeLessThan(ranked[1].distanceMi);
  });
});
