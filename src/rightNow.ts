import type { UnknownOutputParams } from "expo-router";
import type { PlatformOSType } from "react-native";
import { z } from "zod";
import { CoordinatesSchema, type Coordinates } from "./core/geo";
import type { OpenState } from "./core/openNow";
import type { BBox } from "./core/overpass";
import type { RankedSpot } from "./core/rank";
import type { Spot } from "./core/spot";

const LAT_DELTA = 0.02;
const LON_DELTA = 0.025;
const QUERY_COORD_DECIMALS = 4;
const FEET_PER_MILE = 5280;

const NavigationPlatformSchema = z.enum(["ios", "android", "web"]);
const RouteParamValueSchema = z.union([
  z.string().min(1),
  z.tuple([z.string().min(1)]),
]);
const RouteCoordinateParamsSchema = z.object({
  lat: RouteParamValueSchema,
  lon: RouteParamValueSchema,
});
const SpotDetailRouteParamsSchema = RouteCoordinateParamsSchema.extend({
  id: RouteParamValueSchema,
});

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

export function spotQueryKey(coordinates: Coordinates) {
  return ["spots", roundedCoordinates(coordinates)] as const;
}

export async function requestLocationPermission(
  requestPermission: () => Promise<{ status: string }>,
  grantedStatus = "granted",
) {
  try {
    const permission = await requestPermission();
    return permission.status === grantedStatus
      ? ({ type: "granted" } as const)
      : ({ type: "denied" } as const);
  } catch (error) {
    return { type: "error", error } as const;
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

  return "hours unknown";
}

export function formatDistance(distanceMi: number): string {
  if (distanceMi < 0.1) {
    return `${Math.max(1, Math.round(distanceMi * FEET_PER_MILE))} ft`;
  }

  return `${distanceMi.toFixed(1)} mi`;
}

export function formatAmenity(amenity: Spot["amenity"]): string {
  return amenity.replaceAll("_", " ");
}

function formatOsmList(value: string): string {
  return value
    .split(";")
    .map((part) => part.trim().replaceAll("_", " "))
    .filter(Boolean)
    .join(" · ");
}

export function spotFoodDisplay(spot: Spot) {
  return spot.cuisine
    ? ({
        label: "cuisine",
        text: formatOsmList(spot.cuisine),
      } as const)
    : ({ label: "category", text: formatAmenity(spot.amenity) } as const);
}

export function formatCuisine(spot: Spot): string {
  return spotFoodDisplay(spot).text;
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
      ? `open · closes ${formatClock(state.closesAt)}`
      : formatHeadline(state);
  }

  if (state.status === "closed") {
    return state.opensAt ? `closed · opens ${formatClock(state.opensAt)}` : "closed";
  }

  if (state.reason === "no hours in OSM") {
    return "hours unknown · not listed in OpenStreetMap";
  }

  if (state.reason === "unparseable hours") {
    return "hours unknown · OpenStreetMap hours need review";
  }

  return "hours unknown · could not read hours";
}

export function nextOpeningLabel(ranked: RankedSpot[]): string | null {
  const next = ranked
    .filter(
      (item) => item.state.status === "closed" && item.state.opensAt != null,
    )
    .sort((a, b) => {
      const aTime =
        a.state.status === "closed" ? a.state.opensAt?.getTime() : null;
      const bTime =
        b.state.status === "closed" ? b.state.opensAt?.getTime() : null;
      return (
        (aTime ?? Number.POSITIVE_INFINITY) -
        (bTime ?? Number.POSITIVE_INFINITY)
      );
    })[0];

  if (!next || next.state.status !== "closed" || !next.state.opensAt) {
    return null;
  }

  return `next: ${next.spot.name.toLowerCase()} · ${formatClock(next.state.opensAt)}`;
}

export function rightNowRows(
  ranked: RankedSpot[],
  coordinates: Coordinates,
) {
  return ranked
    .filter((item) => item.state.status !== "closed")
    .map((item) => ({
      ranked: item,
      routeId: routeIdForSpotId(item.spot.id),
      coordinates,
    }));
}

export function routeIdForSpotId(id: string): string {
  return encodeURIComponent(id).replaceAll("~", "%7E").replaceAll("%", "~");
}

function firstRouteParam(
  value: z.infer<typeof RouteParamValueSchema>,
): string {
  return Array.isArray(value) ? value[0] : value;
}

export function spotIdForRouteId(routeId: UnknownOutputParams[string]): string {
  const id = firstRouteParam(RouteParamValueSchema.parse(routeId));
  try {
    return decodeURIComponent(id.replaceAll("~", "%"));
  } catch {
    throw new Error("Invalid spot route id");
  }
}

function coordinatesFromRouteParams(
  params: z.infer<typeof RouteCoordinateParamsSchema>,
): Coordinates {
  const lat = firstRouteParam(params.lat);
  const lon = firstRouteParam(params.lon);
  const coordinates = CoordinatesSchema.safeParse({
    lat: Number(lat),
    lon: Number(lon),
  });

  if (!coordinates.success) {
    throw new Error("Invalid spot coordinates");
  }

  return roundedCoordinates(coordinates.data);
}

export function coordinatesFromParams(params: UnknownOutputParams): Coordinates {
  return coordinatesFromRouteParams(RouteCoordinateParamsSchema.parse(params));
}

export function spotDetailRouteFromParams(params: UnknownOutputParams) {
  const parsedParams = SpotDetailRouteParamsSchema.safeParse(params);

  if (!parsedParams.success) {
    throw new Error("Invalid spot detail route params");
  }

  return {
    coordinates: coordinatesFromRouteParams(parsedParams.data),
    spotId: spotIdForRouteId(parsedParams.data.id),
  };
}

export function navigationPlatformFromOS(platform: PlatformOSType) {
  return NavigationPlatformSchema.parse(platform);
}

export function buildNavigateUrl(
  spot: Spot,
  platform: z.infer<typeof NavigationPlatformSchema>,
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
