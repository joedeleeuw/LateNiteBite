import { z } from "zod";
import { SpotSchema } from "@/core/spot";

export const MAX_SPOT_PHOTO_LOOKUPS = 12;

export const SpotPhotoLookupSchema = SpotSchema.pick({
  id: true,
  name: true,
  amenity: true,
  coordinates: true,
  cuisine: true,
  phone: true,
  website: true,
});

export const SpotPhotoRequestSchema = z.object({
  spots: z.array(SpotPhotoLookupSchema).min(1).max(MAX_SPOT_PHOTO_LOOKUPS),
});

export const SpotPhotoAttributionSchema = z.object({
  label: z.string(),
  authors: z.array(
    z.object({
      name: z.string(),
      uri: z.string().optional(),
    }),
  ),
});

export const SpotPhotoSchema = z.object({
  provider: z.enum(["google"]),
  uri: z.string().url(),
  width: z.number().optional(),
  height: z.number().optional(),
  attribution: SpotPhotoAttributionSchema,
  providerPlaceUrl: z.string().url().optional(),
});

export const SpotPhotoResultSchema = z.object({
  spotId: z.string(),
  photo: SpotPhotoSchema.nullable(),
  error: z.string().optional(),
});

const SpotPhotosResponseSchema = z.object({
  results: z.array(SpotPhotoResultSchema),
});

export type SpotPhoto = z.infer<typeof SpotPhotoSchema>;
export type SpotPhotoLookup = z.infer<typeof SpotPhotoLookupSchema>;
export type SpotPhotoRequest = z.infer<typeof SpotPhotoRequestSchema>;
export type SpotPhotoResult = z.infer<typeof SpotPhotoResultSchema>;

export function getSpotPhotosEndpoint(
  apiBaseUrl = process.env.EXPO_PUBLIC_LNB_API_BASE_URL,
): string {
  if (!apiBaseUrl?.trim()) {
    throw new Error(
      "EXPO_PUBLIC_LNB_API_BASE_URL is required for spot photos.",
    );
  }

  return `${apiBaseUrl.replace(/\/+$/, "")}/api/spot-photos`;
}

export function buildSpotPhotoRequest(
  spot: SpotPhotoLookup,
): SpotPhotoLookup {
  return {
    id: spot.id,
    name: spot.name,
    amenity: spot.amenity,
    cuisine: spot.cuisine,
    coordinates: spot.coordinates,
    phone: spot.phone,
    website: spot.website,
  };
}

export function spotPhotoQueryKey(spots: SpotPhotoLookup[]) {
  return [
    "spot-photos",
    spots.map((spot) => ({
      id: spot.id,
      lat: spot.coordinates.lat,
      lon: spot.coordinates.lon,
    })),
  ] as const;
}

export async function fetchSpotPhotos(
  spots: SpotPhotoLookup[],
  fetcher: typeof fetch = fetch,
): Promise<SpotPhotoResult[]> {
  const body = {
    spots: spots.slice(0, MAX_SPOT_PHOTO_LOOKUPS).map(buildSpotPhotoRequest),
  } satisfies SpotPhotoRequest;

  const response = await fetcher(getSpotPhotosEndpoint(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error("spot photos unavailable");
  }

  return SpotPhotosResponseSchema.parse(await response.json()).results;
}

export function spotPhotoAttributionText(photo: SpotPhoto): string {
  const authors = photo.attribution.authors
    .map((author) => author.name)
    .join(", ");
  return authors
    ? `${photo.attribution.label} · ${authors}`
    : photo.attribution.label;
}
