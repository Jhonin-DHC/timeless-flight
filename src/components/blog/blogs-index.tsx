import Link from "next/link";
import { RemoteImage } from "@/components/remote-image";
import { publicBlogPath, type PublicBlog } from "@/lib/blog-types";

export function BlogsIndex({ posts }: { posts: PublicBlog[] }) {
  if (posts.length === 0) {
    return <p className="text-sm text-[var(--muted)]">No published posts yet. Check back soon.</p>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {posts.map((post) => (
        <article key={post.slug} className="glass-card flex flex-col overflow-hidden p-0">
          {post.coverUrl ? (
            <div className="relative h-44 w-full overflow-hidden">
              <RemoteImage src={post.coverUrl} alt={post.coverAlt || post.title} className="object-cover" sizes="420px" />
            </div>
          ) : null}
          <div className="flex flex-1 flex-col space-y-2 p-5">
            <p className="text-xs uppercase tracking-wide text-[var(--brand-c)]">{post.categoryLabel}</p>
            <h2 className="text-xl font-semibold">
              <Link href={publicBlogPath(post.slug)} className="hover:text-[var(--brand-a)]">
                {post.title}
              </Link>
            </h2>
            <p className="text-sm text-[var(--muted)]">{post.summary}</p>
            <p className="mt-auto pt-2 text-xs text-[var(--muted)]">
              {post.readingMinutes} min read
              {post.publishedAt ? ` · ${new Date(post.publishedAt).toLocaleDateString()}` : ""}
            </p>
          </div>
        </article>
      ))}
    </div>
  );
}
