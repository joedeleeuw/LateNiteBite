import { z } from "zod";
import { FOOD_AMENITIES, SpotSchema, type Spot } from "./spot";

export type BBox = {
  south: number;
  west: number;
  north: number;
  east: number;
};

const ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.openstreetmap.fr/api/interpreter",
];

const RETRYABLE = new Set([429, 502, 503, 504]);
const REQUEST_TIMEOUT_MS = 35_000;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

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

function parseElements(raw: unknown): Spot[] {
  const elements = z
    .array(OverpassElementSchema)
    .parse((raw as { elements?: unknown }).elements ?? []);

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
  let lastError = "no endpoints tried";

  for (const endpoint of ENDPOINTS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await fetch(endpoint + query, {
          headers: HEADERS,
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        });
        if (res.ok) return parseElements(await res.json());

        lastError = `${endpoint} -> ${res.status}`;
        if (!RETRYABLE.has(res.status)) break;
        await sleep(3000 * (attempt + 1));
      } catch (err) {
        lastError = `${endpoint} -> ${String(err)}`;
        await sleep(1000);
      }
    }
  }

  throw new Error(`All Overpass endpoints failed: ${lastError}`);
}
