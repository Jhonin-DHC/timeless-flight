import { blogs } from "@/data/blogs";

export default function BlogsPage() {
  return (
    <section className="space-y-6">
      <h1 className="section-title">Blog Resources</h1>
      <div className="grid gap-4 md:grid-cols-2">
        {blogs.map((post) => (
          <article key={post.slug} className="glass-card">
            <p className="text-xs uppercase tracking-wide text-[var(--brand-c)]">{post.category}</p>
            <h2 className="mt-2 text-xl font-semibold">{post.title}</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">{post.excerpt}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
