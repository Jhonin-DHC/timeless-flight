import { toDisplayMediaUrl } from "@/lib/r2-display";
import { extractYoutubeVideoId, youtubeEmbedUrlForVideo } from "@/lib/youtube";

type VideoPlayerProps = {
  title: string;
  videoUrl?: string;
  youtubeVideoId?: string;
  className?: string;
};

/** Prefer explicit YouTube id, otherwise detect a YouTube URL in videoUrl. */
export function resolveYoutubeVideoId(youtubeVideoId = "", videoUrl = "") {
  return extractYoutubeVideoId(youtubeVideoId) || extractYoutubeVideoId(videoUrl) || "";
}

export function VideoPlayer({ title, videoUrl = "", youtubeVideoId = "", className }: VideoPlayerProps) {
  const ytId = resolveYoutubeVideoId(youtubeVideoId, videoUrl);

  if (ytId) {
    return (
      <iframe
        title={title}
        src={youtubeEmbedUrlForVideo(ytId)}
        className={className ?? "aspect-video w-full rounded-xl bg-black"}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
      />
    );
  }

  if (!videoUrl) {
    return (
      <div
        className={
          className ??
          "flex aspect-video w-full items-center justify-center rounded-xl bg-black/40 text-sm text-[var(--muted)]"
        }
      >
        Video unavailable
      </div>
    );
  }

  const src = toDisplayMediaUrl(videoUrl);
  const isExternal = /^https?:\/\//i.test(src) && !src.includes("/api/media/");

  if (isExternal) {
    return (
      <a href={src} target="_blank" rel="noreferrer" className="inline-block text-sm text-[var(--brand-a)]">
        Watch video
      </a>
    );
  }

  return (
    <video
      src={src}
      controls
      playsInline
      preload="metadata"
      className={className ?? "aspect-video w-full rounded-xl bg-black"}
    >
      <track kind="captions" />
    </video>
  );
}
