import { toDisplayMediaUrl } from "@/lib/r2-display";
import { getPublishedVideos } from "@/lib/videos-service";

export const dynamic = "force-dynamic";

export default async function VideosPage() {
  const videos = await getPublishedVideos();

  return (
    <section className="space-y-6">
      <div>
        <h1 className="section-title">Video Resources</h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
          Short guides and market notes from The Aviators Watch team.
        </p>
      </div>

      {videos.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">No videos published yet. Check back soon.</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {videos.map((video) => {
            const src = toDisplayMediaUrl(video.videoUrl);
            const isExternal = /^https?:\/\//i.test(src) && !src.includes("/api/media/");
            return (
              <article key={video.id} className="glass-card space-y-3">
                <h2 className="text-xl font-semibold">{video.title}</h2>
                <p className="text-sm text-[var(--muted)]">{video.description}</p>
                {isExternal ? (
                  <a href={src} target="_blank" rel="noreferrer" className="inline-block text-sm text-[var(--brand-a)]">
                    Watch video
                  </a>
                ) : (
                  <video
                    src={src}
                    controls
                    playsInline
                    preload="metadata"
                    className="aspect-video w-full rounded-xl bg-black"
                  >
                    <track kind="captions" />
                  </video>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
