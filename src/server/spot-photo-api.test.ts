import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "../../app/api/spot-photos+api";
import type { SpotPhotoLookup } from "../spot-photos";

const spot = {
  id: "node/1",
  name: "Late Slice",
  amenity: "restaurant",
  coordinates: { lat: 30.4419, lon: -84.2985 },
} satisfies SpotPhotoLookup;

function spotPhotoRequest() {
  return new Request("https://latenitebite.test/api/spot-photos", {
    method: "POST",
    body: JSON.stringify({ spots: [spot] }),
  });
}

function providerJson(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
}

describe("spot photo API", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("returns 503 without provider calls when the Google credential is missing", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.stubEnv("GOOGLE_PLACES_API_KEY", "");
    const fetcher = vi.fn<typeof fetch>();
    vi.stubGlobal("fetch", fetcher);

    const response = await POST(spotPhotoRequest());

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      error: "photo providers are not configured",
    });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("stops at the provider response edge when Google omits the places array", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.stubEnv("GOOGLE_PLACES_API_KEY", "google-key");
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(providerJson({}));
    vi.stubGlobal("fetch", fetcher);

    const response = await POST(spotPhotoRequest());

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ error: "photos unavailable" });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("returns a Google photo when the venue name matches", async () => {
    vi.stubEnv("GOOGLE_PLACES_API_KEY", "google-key");
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        providerJson({
          places: [
            {
              displayName: { text: "Late Slice" },
              googleMapsUri: "https://maps.google.com/?cid=late-slice",
              photos: [
                {
                  name: "places/late-slice/photos/1",
                  widthPx: 1200,
                  heightPx: 800,
                  authorAttributions: [
                    {
                      displayName: "Photo Person",
                      uri: "https://maps.google.com/contrib/photo-person",
                    },
                  ],
                },
              ],
            },
          ],
        }),
      )
      .mockResolvedValueOnce(
        providerJson({
          photoUri: "https://lh3.googleusercontent.com/late-slice.jpg",
        }),
      );
    vi.stubGlobal("fetch", fetcher);

    const response = await POST(spotPhotoRequest());

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      results: [
        {
          spotId: "node/1",
          photo: {
            provider: "google",
            uri: "https://lh3.googleusercontent.com/late-slice.jpg",
            width: 1200,
            height: 800,
            providerPlaceUrl: "https://maps.google.com/?cid=late-slice",
            attribution: {
              label: "Google Maps",
              authors: [
                {
                  name: "Photo Person",
                  uri: "https://maps.google.com/contrib/photo-person",
                },
              ],
            },
          },
        },
      ],
    });
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("does not use a provider photo when the venue name does not match", async () => {
    vi.stubEnv("GOOGLE_PLACES_API_KEY", "google-key");
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        providerJson({
          places: [
            {
              displayName: { text: "Wrong Place" },
              googleMapsUri: "https://maps.google.com/?cid=wrong",
              photos: [{ name: "places/wrong/photos/1" }],
            },
          ],
        }),
      );
    vi.stubGlobal("fetch", fetcher);

    const response = await POST(spotPhotoRequest());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      results: [
        {
          spotId: "node/1",
          photo: null,
          error: "no photo found",
        },
      ],
    });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("returns no photo when Google has no matching photo", async () => {
    vi.stubEnv("GOOGLE_PLACES_API_KEY", "google-key");
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(providerJson({ places: [] }));
    vi.stubGlobal("fetch", fetcher);

    const response = await POST(spotPhotoRequest());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      results: [
        {
          spotId: "node/1",
          photo: null,
          error: "no photo found",
        },
      ],
    });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});
