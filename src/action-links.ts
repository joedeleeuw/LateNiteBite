export async function openExternalUrl(
  url: string,
  openURL: (url: string) => Promise<unknown>,
): Promise<void> {
  const trimmedUrl = url.trim();

  if (!trimmedUrl) {
    throw new Error("External URL is required");
  }

  new URL(trimmedUrl);
  await openURL(trimmedUrl);
}

export function ensureHttpProtocol(url: string): string {
  const trimmedUrl = url.trim();

  if (!trimmedUrl) {
    throw new Error("Website URL is required");
  }

  const normalizedUrl = /^https?:\/\//i.test(trimmedUrl)
    ? trimmedUrl
    : `https://${trimmedUrl}`;
  new URL(normalizedUrl);
  return normalizedUrl;
}
