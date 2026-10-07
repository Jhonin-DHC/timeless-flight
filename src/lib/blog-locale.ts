import { BLOG_LOCALE, publicBlogPath, type BlogLocale } from "@/lib/blog-types";

/** English-only site. Do not import `next/headers` here — this file may be used from the client. */
export function defaultBlogLocale(): BlogLocale {
  return BLOG_LOCALE;
}

export function localeSitePath(slug: string, _locale: BlogLocale = BLOG_LOCALE) {
  return publicBlogPath(slug);
}
