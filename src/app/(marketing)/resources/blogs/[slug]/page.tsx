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
    <article className="w-full space-y-5 md:space-y-8">
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
      {post.coverUrl ? (
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
    </article>
  );
}
