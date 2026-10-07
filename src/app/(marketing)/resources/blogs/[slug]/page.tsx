import Link from "next/link";
import { notFound } from "next/navigation";
import { BlogBody } from "@/components/blog/blog-body";
import { RemoteImage } from "@/components/remote-image";
import { getPublishedBlogBySlug } from "@/lib/blog-service";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPublishedBlogBySlug(slug);
  if (!post) return { title: "Blog" };
  return {
    title: post.title,
    description: post.summary
  };
}

export default async function BlogArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPublishedBlogBySlug(slug);
  if (!post) notFound();

  return (
    <article className="mx-auto max-w-3xl space-y-6">
      <p className="text-sm text-[var(--muted)]">
        <Link href="/resources/blogs" className="text-[var(--brand-a)]">
          Blogs
        </Link>
        <span> / {post.categoryLabel}</span>
      </p>
      <h1 className="section-title">{post.title}</h1>
      <p className="text-sm text-[var(--muted)]">
        {post.readingMinutes} min read
        {post.publishedAt ? ` · ${new Date(post.publishedAt).toLocaleDateString()}` : ""}
      </p>
      {post.coverUrl ? (
        <div className="relative h-72 w-full overflow-hidden rounded-2xl">
          <RemoteImage src={post.coverUrl} alt={post.coverAlt || post.title} className="object-cover" sizes="768px" />
        </div>
      ) : null}
      {post.summary ? <p className="section-copy">{post.summary}</p> : null}
      <BlogBody body={post.body} />
    </article>
  );
}
