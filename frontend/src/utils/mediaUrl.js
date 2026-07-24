/** Turn stored upload URLs into same-origin paths the browser can load. */
export function resolveMediaUrl(url) {
  if (!url) return url;
  if (url.startsWith("/")) return url;
  try {
    const parsed = new URL(url);
    if (parsed.pathname.startsWith("/uploads/")) return parsed.pathname;
  } catch {
    // ignore invalid URLs
  }
  return url;
}
