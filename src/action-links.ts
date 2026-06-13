export type OpenURL = (url: string) => Promise<unknown>;

export async function openExternalUrl(
  url: string,
  openURL: OpenURL,
): Promise<void> {
  await openURL(url);
}

export function ensureHttpProtocol(url: string): string {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}
