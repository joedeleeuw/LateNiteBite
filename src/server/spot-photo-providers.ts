import { z } from "zod";
import type {
  SpotPhoto,
  SpotPhotoLookup,
  SpotPhotoResult,
} from "@/spot-photos";

const GoogleAuthorAttributionSchema = z.object({
  displayName: z.string().optional(),
  uri: z.string().optional(),
});

const GooglePhotoSchema = z.object({
  name: z.string(),
  widthPx: z.number().optional(),
  heightPx: z.number().optional(),
  authorAttributions: z.array(GoogleAuthorAttributionSchema).optional(),
});

const GoogleTextSearchSchema = z.object({
  places: z.array(
    z.object({
      displayName: z.object({ text: z.string().optional() }).optional(),
      googleMapsUri: z.string().url().optional(),
      photos: z.array(GooglePhotoSchema).optional(),
    }),
  ),
});

const GooglePhotoMediaSchema = z.object({
  photoUri: z.string().url(),
});

const ProviderKeySchema = z.preprocess(
  (value) => (typeof value === "string" ? value.trim() : value),
  z.string().min(1),
);

export const PhotoProviderEnvSchema = z.object({
  GOOGLE_PLACES_API_KEY: ProviderKeySchema,
});

export type PhotoProviderEnv = z.infer<typeof PhotoProviderEnvSchema>;

export class PhotoProviderConfigError extends Error {
  constructor() {
    super("Photo provider credentials are required.");
    this.name = "PhotoProviderConfigError";
  }
}

class PhotoProviderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PhotoProviderError";
  }
}

export function parsePhotoProviderEnv(env: unknown): PhotoProviderEnv {
  const parsed = PhotoProviderEnvSchema.safeParse(env);

  if (!parsed.success) {
    throw new PhotoProviderConfigError();
  }

  return parsed.data;
}

function googleIncludedType(spot: SpotPhotoLookup): string {
  if (spot.amenity === "cafe") return "cafe";
  if (spot.amenity === "bar" || spot.amenity === "pub") return "bar";
  return "restaurant";
}

function providerQueryText(spot: SpotPhotoLookup): string {
  return [spot.name, spot.cuisine, spot.amenity.replaceAll("_", " ")]
    .filter(Boolean)
    .join(" ");
}

function normalizeProviderName(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function providerNameMatchesSpot(
  spot: SpotPhotoLookup,
  candidateName: string | undefined,
): boolean {
  if (!candidateName) {
    return false;
  }

  const spotName = normalizeProviderName(spot.name);
  const providerName = normalizeProviderName(candidateName);

  return (
    !!spotName &&
    !!providerName &&
    (spotName === providerName ||
      spotName.includes(providerName) ||
      providerName.includes(spotName))
  );
}

async function readProviderJson(
  response: Response,
  provider: string,
): Promise<unknown> {
  if (!response.ok) {
    throw new PhotoProviderError(`${provider} photo request failed`);
  }

  return response.json();
}

export async function fetchGoogleSpotPhoto(
  apiKey: PhotoProviderEnv["GOOGLE_PLACES_API_KEY"],
  spot: SpotPhotoLookup,
  fetcher: typeof fetch = fetch,
): Promise<SpotPhoto | null> {
  const searchResponse = await fetcher(
    "https://places.googleapis.com/v1/places:searchText",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask":
          "places.displayName,places.googleMapsUri,places.photos",
      },
      body: JSON.stringify({
        textQuery: providerQueryText(spot),
        includedType: googleIncludedType(spot),
        locationBias: {
          circle: {
            center: {
              latitude: spot.coordinates.lat,
              longitude: spot.coordinates.lon,
            },
            radius: 500,
          },
        },
      }),
    },
  );
  const searchJson = GoogleTextSearchSchema.parse(
    await readProviderJson(searchResponse, "Google"),
  );
  const place = searchJson.places.find(
    (item) =>
      providerNameMatchesSpot(spot, item.displayName?.text) && item.photos?.[0],
  );
  const photo = place?.photos?.[0];

  if (!photo) {
    return null;
  }

  const mediaUrl = new URL(
    `https://places.googleapis.com/v1/${photo.name}/media`,
  );
  mediaUrl.searchParams.set("maxWidthPx", "1200");
  mediaUrl.searchParams.set("skipHttpRedirect", "true");
  mediaUrl.searchParams.set("key", apiKey);

  const mediaResponse = await fetcher(mediaUrl.toString());
  const mediaJson = GooglePhotoMediaSchema.parse(
    await readProviderJson(mediaResponse, "Google"),
  );

  return {
    provider: "google",
    uri: mediaJson.photoUri,
    width: photo.widthPx,
    height: photo.heightPx,
    attribution: {
      label: "Google Maps",
      authors: (photo.authorAttributions ?? []).flatMap((author) => {
        if (!author.displayName) {
          return [];
        }

        return [
          {
            name: author.displayName,
            ...(author.uri ? { uri: author.uri } : {}),
          },
        ];
      }),
    },
    providerPlaceUrl: place.googleMapsUri,
  };
}

async function resolveOneSpotPhoto(
  env: PhotoProviderEnv,
  fetcher: typeof fetch,
  spot: SpotPhotoLookup,
): Promise<SpotPhotoResult> {
  const photo = await fetchGoogleSpotPhoto(
    env.GOOGLE_PLACES_API_KEY,
    spot,
    fetcher,
  );

  if (photo) {
    return { spotId: spot.id, photo };
  }

  return { spotId: spot.id, photo: null, error: "no photo found" };
}

export async function resolveSpotPhotos(
  spots: SpotPhotoLookup[],
  env: PhotoProviderEnv,
  fetcher: typeof fetch = fetch,
): Promise<SpotPhotoResult[]> {
  return Promise.all(
    spots.map((spot) => resolveOneSpotPhoto(env, fetcher, spot)),
  );
}
