import { videos } from "@/data/videos";

export default function VideosPage() {
  return (
    <section className="space-y-6">
      <h1 className="section-title">Video Resources</h1>
      <div className="grid gap-4 md:grid-cols-2">
        {videos.map((video) => (
          <article key={video.id} className="glass-card">
            <h2 className="text-xl font-semibold">{video.title}</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">{video.description}</p>
            <a href={video.url} target="_blank" rel="noreferrer" className="mt-4 inline-block text-sm text-[var(--brand-a)]">Watch video</a>
          </article>
        ))}
      </div>
    </section>
  );
}
