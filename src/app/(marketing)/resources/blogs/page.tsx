import { BlogsIndex } from "@/components/blog/blogs-index";
import { listPublishedBlogs } from "@/lib/blog-service";

export const dynamic = "force-dynamic";

export default async function BlogsPage() {
  const posts = await listPublishedBlogs();

  return (
    <section className="space-y-6">
      <div>
        <h1 className="section-title">Blog Resources</h1>
        <p className="section-copy mt-2 max-w-3xl">Buying notes, market context, and collector guidance from The Aviators Watch desk.</p>
      </div>
      <BlogsIndex posts={posts} />
    </section>
  );
}
