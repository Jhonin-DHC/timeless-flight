import type { Metadata } from "next";
import { BlogsIndex } from "@/components/blog/blogs-index";
import { listPublishedBlogs } from "@/lib/blog-service";
import { staticPageMetadata } from "@/lib/listing-seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = staticPageMetadata({
  title: "Watch collecting notes",
  description:
    "Buying guides and collector notes on vintage Omega, Seiko Flightmaster, Breitling Super 8, and other branded watches.",
  path: "/resources/blogs"
});

export default async function BlogsPage() {
  const posts = await listPublishedBlogs();

  return (
    <section className="space-y-6">
      <div>
        <h1 className="section-title">Blog Resources</h1>
        <p className="section-copy mt-2 max-w-4xl">Buying notes, market context, and collector guidance from The Aviators Watch desk.</p>
      </div>
      <BlogsIndex posts={posts} />
    </section>
  );
}
