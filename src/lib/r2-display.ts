const LEGACY_R2_PUBLIC_HOSTS = ["pub-69760bb13cf94a5384c7371a8d805acb.r2.dev"];
const KNOWN_CUSTOM_R2_HOSTS = ["images.theaviatorswatch.com"];

function isAllowedMediaKey(key: string) {
  return Boolean(key) && key.startsWith("listings/") && !key.includes("..") && !key.includes("\\");
}

function isOurR2PublicHost(hostname: string) {
  return (
    KNOWN_CUSTOM_R2_HOSTS.includes(hostname) ||
    LEGACY_R2_PUBLIC_HOSTS.includes(hostname) ||
    hostname.endsWith(".r2.dev")
  );
}

/** Convert stored R2 public URLs to same-origin /api/media/... (safe for client components). */
export function toDisplayImageUrl(url: string) {
  if (!url) return url;
  if (url.startsWith("/api/media/")) return url;
  try {
    const parsed = new URL(url);
    if (!isOurR2PublicHost(parsed.hostname)) return url;
    const key = parsed.pathname.replace(/^\/+/, "");
    if (!isAllowedMediaKey(key)) return url;
    return `/api/media/${key.split("/").map(encodeURIComponent).join("/")}`;
  } catch {
    return url;
  }
}

export function toDisplayImageUrls(urls: string[]) {
  return urls.map(toDisplayImageUrl);
}
