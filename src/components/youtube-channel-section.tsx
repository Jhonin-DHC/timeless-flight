import type { YoutubeChannelConfig } from "@/lib/youtube";

type YoutubeChannelSectionProps = {
  config: YoutubeChannelConfig;
  embedUrl: string | null;
};

export function YoutubeChannelSection({ config, embedUrl }: YoutubeChannelSectionProps) {
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="section-title">{config.sectionTitle}</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">Latest uploads and guides from our channel.</p>
        </div>
        {config.channelUrl ? (
          <a
            href={config.channelUrl}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-[var(--brand-a)]"
          >
            Visit channel
          </a>
        ) : null}
      </div>

      {embedUrl ? (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-black">
          <iframe
            title={config.sectionTitle}
            src={embedUrl}
            className="aspect-video w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      ) : (
        <div className="glass-card space-y-2 text-sm text-[var(--muted)]">
          <p>Channel linked. Add a Channel ID (starts with UC…) or Playlist ID in Admin → Videos to enable the embed player.</p>
          {config.channelUrl ? (
            <a href={config.channelUrl} target="_blank" rel="noreferrer" className="text-[var(--brand-a)]">
              Open YouTube channel
            </a>
          ) : null}
        </div>
      )}
    </section>
  );
}
