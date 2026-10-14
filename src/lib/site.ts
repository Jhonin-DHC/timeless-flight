export const SITE_NAME = "The Aviators Watch";
export const SITE_PHONE_DISPLAY = "+1 737-387-3738";
export const SITE_PHONE_HREF = "tel:+17373873738";
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.theaviatorswatch.com").replace(/\/$/, "");

export function absoluteUrl(path: string) {
  if (!path) return SITE_URL;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
