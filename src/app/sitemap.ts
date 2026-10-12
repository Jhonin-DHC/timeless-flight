import type { MetadataRoute } from "next";
import { listPublishedBlogs } from "@/lib/blog-service";
import { publicBlogPath } from "@/lib/blog-types";
import { getPublishedListings } from "@/lib/listings-service";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

const STATIC_PATHS = [
  "/",
  "/listings",
  "/vintage",
  "/project-watches",
  "/limited-editions",
  "/about",
  "/sell",
  "/resources",
  "/resources/blogs",
  "/resources/videos",
  "/resources/legal"
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [listings, blogs] = await Promise.all([getPublishedListings(), listPublishedBlogs()]);

  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: `${SITE_URL}${path === "/" ? "" : path}`,
    changeFrequency: path === "/" ? "daily" : "weekly",
    priority: path === "/" ? 1 : 0.7
  }));

  const listingEntries: MetadataRoute.Sitemap = listings.map((listing) => ({
    url: `${SITE_URL}/listings/${listing.slug}`,
    changeFrequency: "weekly",
    priority: 0.6
  }));

  const blogEntries: MetadataRoute.Sitemap = blogs.map((post) => ({
    url: `${SITE_URL}${publicBlogPath(post.slug)}`,
    lastModified: post.publishedAt ? new Date(post.publishedAt) : undefined,
    changeFrequency: "monthly",
    priority: 0.6
  }));

  return [...staticEntries, ...listingEntries, ...blogEntries];
}
