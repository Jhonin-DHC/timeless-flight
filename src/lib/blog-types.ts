export const BLOG_LOCALE = "en" as const;
export type BlogLocale = typeof BLOG_LOCALE;

export const BLOG_STATUSES = ["draft", "published"] as const;
export type BlogStatus = (typeof BLOG_STATUSES)[number];

export const BLOG_CATEGORIES = ["buying-guides", "market-insights", "collector-notes", "selling"] as const;
export type BlogCategory = (typeof BLOG_CATEGORIES)[number];

export const BLOG_CATEGORY_LABELS: Record<BlogCategory, string> = {
  "buying-guides": "Buying Guides",
  "market-insights": "Market Insights",
  "collector-notes": "Collector Notes",
  selling: "Selling"
};

export interface BlogImage {
  url: string;
  alt: string;
  caption: string;
}

export interface AdminBlog {
  id: string;
  slug: string;
  locale: BlogLocale;
  translationOf: string;
  title: string;
  summary: string;
  category: BlogCategory;
  body: string;
  status: BlogStatus;
  publishedAt: string | null;
  readingMinutes: number;
  updatedByEmail: string;
  coverUrl: string;
  coverAlt: string;
  images: BlogImage[];
  previousSlugs: string[];
  createdAt: string | null;
  updatedAt: string | null;
}

export interface PublicBlog {
  slug: string;
  locale: BlogLocale;
  title: string;
  summary: string;
  category: BlogCategory;
  categoryLabel: string;
  body: string;
  publishedAt: string | null;
  readingMinutes: number;
  coverUrl: string;
  coverAlt: string;
  images: BlogImage[];
}

export function isBlogCategory(value: string): value is BlogCategory {
  return (BLOG_CATEGORIES as readonly string[]).includes(value);
}

export function isBlogStatus(value: string): value is BlogStatus {
  return (BLOG_STATUSES as readonly string[]).includes(value);
}

function publishedAtTime(value: string | Date | null | undefined) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  const time = date.getTime();
  return Number.isNaN(time) ? null : time;
}

/** Published with a future date — hidden from shoppers until that time. */
export function isBlogScheduled(post: { status: string; publishedAt?: string | Date | null }) {
  if (post.status !== "published") return false;
  const time = publishedAtTime(post.publishedAt);
  return time !== null && time > Date.now();
}

/** Visible on the public blog index and article URL. */
export function isBlogLive(post: { status: string; publishedAt?: string | Date | null }) {
  return post.status === "published" && !isBlogScheduled(post);
}

export function publicBlogPath(slug: string) {
  return `/resources/blogs/${slug}`;
}
