import type { BBox } from "@/core/overpass";
import type { Coordinates } from "@/core/geo";
import type { OpenState } from "@/core/openNow";
import type { RankedSpot } from "@/core/rank";
import type { Spot } from "@/core/spot";

const LAT_DELTA = 0.02;
const LON_DELTA = 0.025;
const QUERY_COORD_DECIMALS = 4;
const FEET_PER_MILE = 5280;

export type SpotQueryKey = ["spots", Coordinates];

export type NavigationPlatform = "ios" | "android" | "web" | string;

export type LocationPermissionRequestResult = {
  status: string;
};

export type LocationPermissionResult =
  | { type: "granted" }
  | { type: "denied" }
  | { type: "error"; error: unknown };

type NavigableSpot = Pick<Spot, "coordinates" | "name">;

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

export async function requestLocationPermission(
  requestPermission: () => Promise<LocationPermissionRequestResult>,
  grantedStatus = "granted",
): Promise<LocationPermissionResult> {
  try {
    const permission = await requestPermission();
    return permission.status === grantedStatus
      ? { type: "granted" }
      : { type: "denied" };
  } catch (error) {
    return { type: "error", error };
  }
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
  const next = ranked
    .filter(
      (item) => item.state.status === "closed" && item.state.opensAt != null,
    )
    .sort((a, b) => {
      const aTime = a.state.status === "closed" ? a.state.opensAt?.getTime() : null;
      const bTime = b.state.status === "closed" ? b.state.opensAt?.getTime() : null;
      return (aTime ?? Number.POSITIVE_INFINITY) - (bTime ?? Number.POSITIVE_INFINITY);
    })[0];

  if (!next || next.state.status !== "closed" || !next.state.opensAt) {
    return null;
  }

  return `next: ${next.spot.name.toLowerCase()} · ${formatClock(next.state.opensAt)}`;
}

export function routeIdForSpotId(id: string): string {
  return encodeURIComponent(id).replaceAll("~", "%7E").replaceAll("%", "~");
}

export function spotIdForRouteId(routeId: string | undefined): string | null {
  if (!routeId) {
    return null;
  }

  try {
    return decodeURIComponent(routeId.replaceAll("~", "%"));
  } catch {
    return null;
  }
}

export function coordinatesFromParams(params: {
  lat?: string | string[];
  lon?: string | string[];
}): Coordinates | null {
  const lat = Array.isArray(params.lat) ? params.lat[0] : params.lat;
  const lon = Array.isArray(params.lon) ? params.lon[0] : params.lon;
  const parsed = {
    lat: lat ? Number(lat) : NaN,
    lon: lon ? Number(lon) : NaN,
  };

  if (!Number.isFinite(parsed.lat) || !Number.isFinite(parsed.lon)) {
    return null;
  }

  return roundedCoordinates(parsed);
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
    return `geo:${destination}?q=${encodeURIComponent(`${destination}(${spot.name})`)}`;
  }

  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
}
