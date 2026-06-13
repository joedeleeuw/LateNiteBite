import { z } from "zod";
import { FOOD_AMENITIES, SpotSchema, type Spot } from "./spot";

export type BBox = {
  south: number;
  west: number;
  north: number;
  east: number;
};

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
  center: z.object({ lat: z.number(), lon: z.number() }).optional(),
  tags: z.record(z.string(), z.string()).default({}),
});

const OverpassResponseSchema = z.object({
  elements: z.array(OverpassElementSchema),
});

function parseElements(raw: unknown): Spot[] {
  const { elements } = OverpassResponseSchema.parse(raw);

  const spots: Spot[] = [];
  for (const el of elements) {
    const coords =
      el.center ??
      (el.lat != null && el.lon != null
        ? { lat: el.lat, lon: el.lon }
        : null);
    if (!coords || !el.tags.name) continue;

    const parsed = SpotSchema.safeParse({
      id: `${el.type}/${el.id}`,
      name: el.tags.name,
      amenity: el.tags.amenity,
      coordinates: coords,
      openingHours: el.tags.opening_hours,
      cuisine: el.tags.cuisine,
      phone: el.tags.phone ?? el.tags["contact:phone"],
      website: el.tags.website ?? el.tags["contact:website"],
    });
    if (parsed.success) spots.push(parsed.data);
  }
  return spots;
}

const HEADERS = {
  Accept: "application/json",
  "User-Agent":
    "LateNiteBite-revival/0.1 (late-night food finder; +https://github.com/joedeleeuw/LateNiteBite)",
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
