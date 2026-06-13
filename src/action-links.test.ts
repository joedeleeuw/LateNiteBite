import { describe, expect, it, vi } from "vitest";
import { ensureHttpProtocol, openExternalUrl } from "./action-links";

describe("action links", () => {
  it("opens external urls through openURL without a support preflight", async () => {
    const openURL = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);

    await openExternalUrl("tel:+15551234567", openURL);

    expect(openURL).toHaveBeenCalledWith("tel:+15551234567");
    expect(openURL).toHaveBeenCalledTimes(1);
  });

  it("uses openURL rejection as the hard failure boundary", async () => {
    const openURL = vi
      .fn<() => Promise<void>>()
      .mockRejectedValue(new Error("native open failed"));

    await expect(openExternalUrl("geo:30,-84", openURL)).rejects.toThrow(
      "native open failed",
    );
  });

  it("normalizes bare website URLs without changing explicit protocols", () => {
    expect(ensureHttpProtocol("latenitebite.example")).toBe(
      "https://latenitebite.example",
    );
    expect(ensureHttpProtocol("http://latenitebite.example")).toBe(
      "http://latenitebite.example",
    );
    expect(ensureHttpProtocol("https://latenitebite.example")).toBe(
      "https://latenitebite.example",
    );
  });
});
