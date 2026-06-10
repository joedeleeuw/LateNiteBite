import type { BBox } from "@/core/overpass";
import type { Coordinates } from "@/core/geo";
import type { OpenState } from "@/core/openNow";
import type { RankedSpot } from "@/core/rank";
import type { Spot } from "@/core/spot";

const LAT_DELTA = 0.02;
const LON_DELTA = 0.025;
const QUERY_COORD_DECIMALS = 4;
const FEET_PER_MILE = 5280;

export type FallbackPlace = {
  label: string;
  coordinates: Coordinates;
};

export const FALLBACK_PLACES: FallbackPlace[] = [
  { label: "tallahassee · fsu", coordinates: { lat: 30.4419, lon: -84.2985 } },
  {
    label: "nyc · washington sq",
    coordinates: { lat: 40.7308, lon: -73.9973 },
  },
];

export type SpotQueryKey = ["spots", Coordinates];

export type NavigationPlatform = "ios" | "android" | "web" | string;

type NavigableSpot = Pick<Spot, "coordinates" | "name">;

const rememberedSpots = new Map<string, RankedSpot>();

function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function trimCoordinate(value: number): string {
  return String(roundTo(value, 6));
}

export function roundedCoordinates(coordinates: Coordinates): Coordinates {
  return {
    lat: roundTo(coordinates.lat, QUERY_COORD_DECIMALS),
    lon: roundTo(coordinates.lon, QUERY_COORD_DECIMALS),
  };
}

export function bboxForCoordinates(coordinates: Coordinates): BBox {
  return {
    south: roundTo(coordinates.lat - LAT_DELTA, 6),
    west: roundTo(coordinates.lon - LON_DELTA, 6),
    north: roundTo(coordinates.lat + LAT_DELTA, 6),
    east: roundTo(coordinates.lon + LON_DELTA, 6),
  };
}

export function spotQueryKey(coordinates: Coordinates): SpotQueryKey {
  return ["spots", roundedCoordinates(coordinates)];
}

export function formatHeadline(state: OpenState): string {
  if (state.status === "open") {
    return state.closesInMin == null
      ? "open"
      : `open · closes in ${state.closesInMin}m`;
  }

  if (state.status === "closed") {
    return "closed";
  }

  return "hours unknown — trust your gut";
}

export function formatDistance(distanceMi: number): string {
  if (distanceMi < 0.1) {
    return `${Math.max(1, Math.round(distanceMi * FEET_PER_MILE))} ft`;
  }

  return `${distanceMi.toFixed(1)} mi`;
}

export function formatAmenity(spot: Pick<Spot, "amenity">): string {
  return spot.amenity.replaceAll("_", " ");
}

export function formatCuisine(spot: Pick<Spot, "amenity" | "cuisine">): string {
  return spot.cuisine?.replaceAll(";", " · ") ?? formatAmenity(spot);
}

export function formatClock(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  })
    .format(date)
    .toLowerCase();
}

export function formatDetailState(state: OpenState): string {
  if (state.status === "open") {
    return state.closesAt
      ? `${formatHeadline(state)} · closes ${formatClock(state.closesAt)}`
      : formatHeadline(state);
  }

  if (state.status === "closed") {
    return state.opensAt ? `closed · opens ${formatClock(state.opensAt)}` : "closed";
  }

  return formatHeadline(state);
}

export function nextOpeningLabel(ranked: RankedSpot[]): string | null {
  const next = ranked.find(
    (item) => item.state.status === "closed" && item.state.opensAt != null,
  );

  if (!next || next.state.status !== "closed" || !next.state.opensAt) {
    return null;
  }

  return `next: ${next.spot.name.toLowerCase()} · ${formatClock(next.state.opensAt)}`;
}

export function routeIdForSpotId(id: string): string {
  return encodeURIComponent(id).replaceAll("%", "~");
}

export function rememberRankedSpots(ranked: RankedSpot[]): void {
  for (const item of ranked) {
    rememberedSpots.set(routeIdForSpotId(item.spot.id), item);
  }
}

export function readRememberedSpot(routeId: string | undefined): RankedSpot | null {
  if (!routeId) {
    return null;
  }

  return rememberedSpots.get(routeId) ?? null;
}

export function buildNavigateUrl(
  spot: NavigableSpot,
  platform: NavigationPlatform,
): string {
  const lat = trimCoordinate(spot.coordinates.lat);
  const lon = trimCoordinate(spot.coordinates.lon);
  const destination = `${lat},${lon}`;

  if (platform === "ios") {
    return `https://maps.apple.com/?daddr=${destination}`;
  }

  if (platform === "android") {
    return `geo:${destination}?q=${destination}(${spot.name})`;
  }

  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
}
