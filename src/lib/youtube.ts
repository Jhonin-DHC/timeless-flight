export type YoutubeChannelConfig = {
  enabled: boolean;
  channelUrl: string;
  channelId: string;
  playlistId: string;
  sectionTitle: string;
};

export const DEFAULT_YOUTUBE_CHANNEL_CONFIG: YoutubeChannelConfig = {
  enabled: false,
  channelUrl: "",
  channelId: "",
  playlistId: "",
  sectionTitle: "From our YouTube channel"
};

/** Extract a YouTube video id from common watch/share/embed URLs. */
export function extractYoutubeVideoId(input: string): string | null {
  const value = input.trim();
  if (!value) return null;
  if (/^[\w-]{11}$/.test(value)) return value;

  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = url.pathname.split("/").filter(Boolean)[0];
      return id && /^[\w-]{11}$/.test(id) ? id : null;
    }
    if (host.endsWith("youtube.com")) {
      const v = url.searchParams.get("v");
      if (v && /^[\w-]{11}$/.test(v)) return v;
      const parts = url.pathname.split("/").filter(Boolean);
      if (parts[0] === "embed" || parts[0] === "shorts" || parts[0] === "live") {
        const id = parts[1];
        return id && /^[\w-]{11}$/.test(id) ? id : null;
      }
    }
  } catch {
    return null;
  }
  return null;
}

/** Parse channel URL / @handle / UC id into normalized fields. */
export function parseYoutubeChannelInput(input: string): { channelUrl: string; channelId: string; handle: string } {
  const value = input.trim();
  if (!value) return { channelUrl: "", channelId: "", handle: "" };

  if (/^UC[\w-]{22}$/.test(value)) {
    return {
      channelUrl: `https://www.youtube.com/channel/${value}`,
      channelId: value,
      handle: ""
    };
  }

  if (value.startsWith("@")) {
    const handle = value.slice(1);
    return {
      channelUrl: `https://www.youtube.com/@${handle}`,
      channelId: "",
      handle
    };
  }

  try {
    const url = new URL(value.startsWith("http") ? value : `https://${value}`);
    const host = url.hostname.replace(/^www\./, "");
    if (!host.endsWith("youtube.com")) {
      return { channelUrl: value, channelId: "", handle: "" };
    }

    const parts = url.pathname.split("/").filter(Boolean);
    if (parts[0] === "channel" && parts[1] && /^UC[\w-]{22}$/.test(parts[1])) {
      return { channelUrl: url.toString(), channelId: parts[1], handle: "" };
    }
    if (parts[0]?.startsWith("@")) {
      const handle = parts[0].slice(1);
      return { channelUrl: url.toString(), channelId: "", handle };
    }
    if (parts[0] === "c" || parts[0] === "user") {
      return { channelUrl: url.toString(), channelId: "", handle: parts[1] || "" };
    }
    return { channelUrl: url.toString(), channelId: "", handle: "" };
  } catch {
    return { channelUrl: value, channelId: "", handle: "" };
  }
}

/** Uploads playlist id derived from channel id (UC… → UU…). */
export function youtubeUploadsPlaylistId(channelId: string): string | null {
  if (!/^UC[\w-]{22}$/.test(channelId)) return null;
  return `UU${channelId.slice(2)}`;
}

export function youtubeEmbedUrlForChannel(config: YoutubeChannelConfig): string | null {
  const playlist = config.playlistId.trim() || youtubeUploadsPlaylistId(config.channelId.trim());
  if (!playlist) return null;
  return `https://www.youtube.com/embed/videoseries?list=${encodeURIComponent(playlist)}`;
}

export function youtubeWatchUrl(videoId: string) {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

export function youtubeEmbedUrlForVideo(videoId: string) {
  return `https://www.youtube.com/embed/${videoId}`;
}
