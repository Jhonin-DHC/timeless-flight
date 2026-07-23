import { connectMongo } from "@/lib/mongodb";
import { normalizePublicImageUrl } from "@/lib/r2";
import {
  DEFAULT_YOUTUBE_CHANNEL_CONFIG,
  type YoutubeChannelConfig,
  youtubeEmbedUrlForChannel
} from "@/lib/youtube";
import { getSetting } from "@/models/AppSettings";
import { VideoResource } from "@/models/VideoResource";
import { videos as staticVideos, type VideoResource as StaticVideo } from "@/data/videos";

export type PublicVideo = {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  youtubeVideoId?: string;
  contentType?: string;
  featured?: boolean;
};

function mapDoc(doc: {
  _id: { toString(): string };
  title: string;
  description?: string;
  videoUrl?: string;
  youtubeVideoId?: string;
  contentType?: string;
  featured?: boolean;
}): PublicVideo {
  return {
    id: doc._id.toString(),
    title: doc.title,
    description: doc.description || "",
    videoUrl: doc.videoUrl ? normalizePublicImageUrl(doc.videoUrl) : "",
    youtubeVideoId: doc.youtubeVideoId || "",
    contentType: doc.contentType || "video/mp4",
    featured: Boolean(doc.featured)
  };
}

function mapStatic(): PublicVideo[] {
  return staticVideos.map((video) => ({
    id: video.id,
    title: video.title,
    description: video.description,
    videoUrl: video.url
  }));
}

export async function getPublishedVideos(): Promise<PublicVideo[]> {
  try {
    await connectMongo();
    const docs = await VideoResource.find({ published: true }).sort({ sortOrder: 1, createdAt: -1 }).lean();
    if (docs.length === 0) return [];
    return docs.map(mapDoc);
  } catch {
    return mapStatic();
  }
}

export async function getFeaturedVideos(limit = 3): Promise<PublicVideo[]> {
  try {
    await connectMongo();
    const featured = await VideoResource.find({ published: true, featured: true })
      .sort({ sortOrder: 1, createdAt: -1 })
      .limit(limit)
      .lean();
    if (featured.length > 0) return featured.map(mapDoc);

    const latest = await VideoResource.find({ published: true })
      .sort({ sortOrder: 1, createdAt: -1 })
      .limit(limit)
      .lean();
    return latest.map(mapDoc);
  } catch {
    return mapStatic().slice(0, limit);
  }
}

export async function getYoutubeChannelConfig(): Promise<YoutubeChannelConfig> {
  try {
    await connectMongo();
    const stored = await getSetting<Partial<YoutubeChannelConfig>>(
      "youtubeChannel",
      DEFAULT_YOUTUBE_CHANNEL_CONFIG
    );
    return {
      ...DEFAULT_YOUTUBE_CHANNEL_CONFIG,
      ...stored,
      enabled: Boolean(stored.enabled),
      channelUrl: typeof stored.channelUrl === "string" ? stored.channelUrl : "",
      channelId: typeof stored.channelId === "string" ? stored.channelId : "",
      playlistId: typeof stored.playlistId === "string" ? stored.playlistId : "",
      sectionTitle:
        typeof stored.sectionTitle === "string" && stored.sectionTitle.trim()
          ? stored.sectionTitle
          : DEFAULT_YOUTUBE_CHANNEL_CONFIG.sectionTitle
    };
  } catch {
    return DEFAULT_YOUTUBE_CHANNEL_CONFIG;
  }
}

export async function getYoutubeChannelSection() {
  const config = await getYoutubeChannelConfig();
  if (!config.enabled) return null;
  const embedUrl = youtubeEmbedUrlForChannel(config);
  if (!embedUrl && !config.channelUrl) return null;
  return { config, embedUrl };
}

export type { StaticVideo };
