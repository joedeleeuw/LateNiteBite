import type { Coordinates } from "./geo";
import { haversineMiles } from "./geo";
import { evaluateOpenNow, type OpenState } from "./openNow";
import type { Spot } from "./spot";

export type RankedSpot = {
  spot: Spot;
  distanceMi: number;
  state: OpenState;
};

const openRank = (s: OpenState): number =>
  s.status === "open" ? 0 : s.status === "unknown" ? 1 : 2;

export function rankSpots(
  spots: Spot[],
  user: Coordinates,
  at: Date,
): RankedSpot[] {
  return spots
    .map((spot) => ({
      spot,
      distanceMi: haversineMiles(user, spot.coordinates),
      state: evaluateOpenNow(spot.openingHours, at, spot.coordinates),
    }))
    .sort((a, b) => {
      const byOpen = openRank(a.state) - openRank(b.state);
      if (byOpen !== 0) return byOpen;
      return a.distanceMi - b.distanceMi;
    });
}
