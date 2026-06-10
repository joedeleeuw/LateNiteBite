import OpeningHours from "opening_hours";
import type { Coordinates } from "./geo";

export type OpenState =
  | { status: "open"; closesAt: Date | null; closesInMin: number | null }
  | { status: "closed"; opensAt: Date | null }
  | { status: "unknown"; reason: string };

const nominatim = (c: Coordinates) => ({
  lat: c.lat,
  lon: c.lon,
  address: { country_code: "us" },
});

export function evaluateOpenNow(
  openingHours: string | undefined,
  at: Date,
  coords: Coordinates,
): OpenState {
  if (!openingHours || !openingHours.trim()) {
    return { status: "unknown", reason: "no hours in OSM" };
  }

  let parser: OpeningHours;
  try {
    parser = new OpeningHours(openingHours, nominatim(coords));
  } catch {
    return { status: "unknown", reason: "unparseable hours" };
  }

  try {
    const isOpen = parser.getState(at);
    const next = parser.getNextChange(at) ?? null;
    if (isOpen) {
      const closesInMin = next
        ? Math.round((next.getTime() - at.getTime()) / 60000)
        : null;
      return { status: "open", closesAt: next, closesInMin };
    }
    return { status: "closed", opensAt: next };
  } catch {
    return { status: "unknown", reason: "evaluation error" };
  }
}
