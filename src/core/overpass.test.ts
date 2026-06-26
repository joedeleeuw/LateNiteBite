import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchSpots } from "./overpass";

describe("fetchSpots", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("rejects malformed named Overpass elements instead of silently dropping them", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          elements: [
            {
              type: "node",
              id: 123,
              lat: 30.4419,
              lon: -84.2985,
              tags: {
                name: "Late Taco",
                amenity: "vending_machine",
              },
            },
          ],
        }),
      })),
    );

    await expect(
      fetchSpots({
        south: 30.4219,
        west: -84.3235,
        north: 30.4619,
        east: -84.2735,
      }),
    ).rejects.toThrow();
  });

  it("rejects named food spots with missing coordinates", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          elements: [
            {
              type: "way",
              id: 456,
              tags: {
                name: "Late Slice",
                amenity: "restaurant",
              },
            },
          ],
        }),
      })),
    );

    await expect(
      fetchSpots({
        south: 30.4219,
        west: -84.3235,
        north: 30.4619,
        east: -84.2735,
      }),
    ).rejects.toThrow();
  });
});
