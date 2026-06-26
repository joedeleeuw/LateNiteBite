import { z } from "zod";
import { CoordinatesSchema } from "./geo";
import { FOOD_AMENITIES, SpotSchema, type Spot } from "./spot";

export const BBoxSchema = z.object({
  south: z.number(),
  west: z.number(),
  north: z.number(),
  east: z.number(),
});
export type BBox = z.infer<typeof BBoxSchema>;

const OVERPASS_ENDPOINT = "https://overpass-api.de/api/interpreter";
const REQUEST_TIMEOUT_MS = 35_000;

export function buildQuery(bbox: BBox): string {
  const amenities = FOOD_AMENITIES.join("|");
  const box = `${bbox.south},${bbox.west},${bbox.north},${bbox.east}`;
  return `[out:json][timeout:30];nwr["amenity"~"^(${amenities})$"](${box});out center tags;`;
}

const OverpassElementSchema = z.object({
  type: z.enum(["node", "way", "relation"]),
  id: z.number(),
  lat: z.number().optional(),
  lon: z.number().optional(),
  center: CoordinatesSchema.optional(),
  tags: z.record(z.string(), z.string()),
});

const OverpassResponseSchema = z.object({
  elements: z.array(OverpassElementSchema),
});

function parseElements(raw: unknown): Spot[] {
  const { elements } = OverpassResponseSchema.parse(raw);

  const spots: Spot[] = [];
  for (const el of elements) {
    if (!el.tags.name) continue;

    const coords =
      el.center ??
      (el.lat != null && el.lon != null
        ? { lat: el.lat, lon: el.lon }
        : undefined);

    spots.push(SpotSchema.parse({
      id: `${el.type}/${el.id}`,
      name: el.tags.name,
      amenity: el.tags.amenity,
      coordinates: coords,
      openingHours: el.tags.opening_hours,
      cuisine: el.tags.cuisine,
      phone: el.tags.phone ?? el.tags["contact:phone"],
      website: el.tags.website ?? el.tags["contact:website"],
    }));
  }
  return spots;
}

const HEADERS = {
  Accept: "application/json",
  "User-Agent":
    "LateNiteBite/1.0.3 (late-night food finder; +https://github.com/joedeleeuw/LateNiteBite)",
};

export async function fetchSpots(bbox: BBox): Promise<Spot[]> {
  const query = "?data=" + encodeURIComponent(buildQuery(bbox));
  const res = await fetch(OVERPASS_ENDPOINT + query, {
    headers: HEADERS,
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!res.ok) {
    throw new Error(`Overpass request failed: ${res.status}`);
  }

  return parseElements(await res.json());
}
