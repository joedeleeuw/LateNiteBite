import {
  parsePhotoProviderEnv,
  PhotoProviderConfigError,
  resolveSpotPhotos,
} from "@/server/spot-photo-providers";
import { SpotPhotoRequestSchema } from "@/spot-photos";

const jsonHeaders = {
  "Cache-Control": "no-store",
};

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid photo request" }, { status: 400 });
  }

  const parsed = SpotPhotoRequestSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ error: "invalid photo request" }, { status: 400 });
  }

  try {
    const results = await resolveSpotPhotos(
      parsed.data.spots,
      parsePhotoProviderEnv({
        GOOGLE_PLACES_API_KEY: process.env.GOOGLE_PLACES_API_KEY,
      }),
    );

    return Response.json({ results }, { headers: jsonHeaders });
  } catch (error) {
    console.error("Spot photo lookup failed:", error);

    if (error instanceof PhotoProviderConfigError) {
      return Response.json(
        { error: "photo providers are not configured" },
        { headers: jsonHeaders, status: 503 },
      );
    }

    return Response.json(
      { error: "photos unavailable" },
      { headers: jsonHeaders, status: 502 },
    );
  }
}
