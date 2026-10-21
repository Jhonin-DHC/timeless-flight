import { notFound, permanentRedirect } from "next/navigation";
import type { Metadata } from "next";
import { BlogArticle } from "@/components/blog/blog-article";
import { getSessionEmail } from "@/lib/auth";
import { resolvePublicBlog } from "@/lib/blog-service";
import { publicBlogPath } from "@/lib/blog-types";
import { getPublishedListings, listingsRelatedToBlog } from "@/lib/listings-service";
import { toDisplayImageUrl } from "@/lib/r2-display";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function lookupBlog(slug: string) {
  let allowDraft = false;
  try {
    allowDraft = Boolean(await getSessionEmail());
  } catch {
    allowDraft = false;
  }
  return resolvePublicBlog(slug, { allowDraft });
}

function socialImageUrl(url: string) {
  if (!url) return undefined;
  const display = toDisplayImageUrl(url);
  if (display.startsWith("http://") || display.startsWith("https://")) return display;
  return `${SITE_URL}${display.startsWith("/") ? display : `/${display}`}`;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const lookup = await lookupBlog(slug);
  if (lookup.kind !== "post") return { title: "Blog" };

  const post = lookup.post;
  const image = socialImageUrl(post.coverUrl);
  const canonical = `${SITE_URL}${publicBlogPath(post.slug)}`;

  return {
    title: post.title,
    description: post.summary,
    robots: lookup.isDraftPreview || lookup.isScheduledPreview ? { index: false, follow: false } : undefined,
    alternates: { canonical },
    openGraph: {
      title: post.title,
      description: post.summary,
      type: "article",
      url: canonical,
      images: image ? [{ url: image, alt: post.coverAlt || post.title }] : undefined
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: post.title,
      description: post.summary,
      images: image ? [image] : undefined
    }
  };
}

export default async function BlogArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const lookup = await lookupBlog(slug);
  if (lookup.kind === "redirect") permanentRedirect(publicBlogPath(lookup.slug));
  if (lookup.kind !== "post") notFound();

  const listings = await getPublishedListings();
  const relatedListings = listingsRelatedToBlog(listings, lookup.post);

  return (
    <BlogArticle
      post={lookup.post}
      draftBanner={lookup.isDraftPreview}
      scheduledBanner={lookup.isScheduledPreview}
      relatedListings={relatedListings}
    />
  );
}
