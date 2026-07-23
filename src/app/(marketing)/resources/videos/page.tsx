import { VideoPlayer } from "@/components/video-player";
import { YoutubeChannelSection } from "@/components/youtube-channel-section";
import { getPublishedVideos, getYoutubeChannelSection } from "@/lib/videos-service";

export const dynamic = "force-dynamic";

export default async function VideosPage() {
  const [videos, youtube] = await Promise.all([getPublishedVideos(), getYoutubeChannelSection()]);

  return (
    <section className="space-y-10">
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
          {videos.map((video) => (
            <article key={video.id} className="glass-card space-y-3">
              <h2 className="text-xl font-semibold">{video.title}</h2>
              <p className="text-sm text-[var(--muted)]">{video.description}</p>
              <VideoPlayer title={video.title} videoUrl={video.videoUrl} youtubeVideoId={video.youtubeVideoId} />
            </article>
          ))}
        </div>
      )}

      {youtube ? <YoutubeChannelSection config={youtube.config} embedUrl={youtube.embedUrl} /> : null}
    </section>
  );
}
