"use client";

import Link from "next/link";
import { BlogBody } from "@/components/blog/blog-body";
import { ListingCard } from "@/components/listing-card";
import { RemoteImage } from "@/components/remote-image";
import { bodyContainsImageUrl } from "@/lib/blog-cover";
import type { PublicBlog } from "@/lib/blog-types";
import type { ShopListing } from "@/lib/listing-types";

export function BlogArticle({
  post,
  draftBanner = false,
  relatedListings = []
}: {
  post: PublicBlog;
  draftBanner?: boolean;
  relatedListings?: ShopListing[];
}) {
  const showCover = Boolean(post.coverUrl) && !bodyContainsImageUrl(post.body, post.coverUrl);
  const gallery = (post.images || []).filter(
    (image) => image.url !== post.coverUrl && !bodyContainsImageUrl(post.body, image.url)
  );

  return (
    <article className="w-full space-y-5 md:space-y-8">
      {draftBanner ? (
        <p className="rounded-xl border border-[var(--brand-c)]/40 bg-[var(--brand-c)]/10 px-4 py-3 text-sm text-[var(--brand-c)]">
          Draft preview — shoppers will not see this post until it is published.
        </p>
      ) : null}
      <p className="text-sm text-[var(--muted)]">
        <Link href="/resources/blogs" className="text-[var(--brand-a)]">
          Blogs
        </Link>
        <span> / {post.categoryLabel}</span>
      </p>
      <h1 className="max-w-5xl text-3xl font-semibold leading-tight md:text-5xl">{post.title}</h1>
      <p className="text-sm text-[var(--muted)] md:text-base">
        {post.readingMinutes} min read
        {post.publishedAt ? ` · ${new Date(post.publishedAt).toLocaleDateString()}` : ""}
      </p>
      {showCover && post.coverUrl ? (
        <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl bg-black/20 sm:aspect-[2/1] lg:aspect-[21/9]">
          <RemoteImage
            src={post.coverUrl}
            alt={post.coverAlt || post.title}
            className="object-contain"
            sizes="(max-width: 1240px) 94vw, 1240px"
          />
        </div>
      ) : null}
      {post.summary ? <p className="max-w-4xl text-base leading-relaxed text-[var(--muted)] md:text-xl">{post.summary}</p> : null}
      <div className="w-full">
        <BlogBody body={post.body} />
      </div>
      {gallery.length > 0 ? (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Photos</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {gallery.map((image) => (
              <figure key={image.url} className="space-y-2">
                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-black/20">
                  <RemoteImage src={image.url} alt={image.alt || post.title} className="object-contain" sizes="(max-width: 768px) 94vw, 600px" />
                </div>
                {image.caption ? <figcaption className="text-center text-sm text-[var(--muted)]">{image.caption}</figcaption> : null}
              </figure>
            ))}
          </div>
        </section>
      ) : null}
      {relatedListings.length > 0 ? (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Watches in this story</h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {relatedListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} compact />
            ))}
          </div>
        </section>
      ) : null}
    </article>
  );
}
