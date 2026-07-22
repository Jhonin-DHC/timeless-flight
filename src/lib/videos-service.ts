import { connectMongo } from "@/lib/mongodb";
import { normalizePublicImageUrl } from "@/lib/r2";
import { VideoResource } from "@/models/VideoResource";
import { videos as staticVideos, type VideoResource as StaticVideo } from "@/data/videos";

export type PublicVideo = {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  contentType?: string;
};

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
    if (docs.length === 0) {
      return [];
    }
    return docs.map((doc) => ({
      id: doc._id.toString(),
      title: doc.title,
      description: doc.description || "",
      videoUrl: normalizePublicImageUrl(doc.videoUrl),
      contentType: doc.contentType || "video/mp4"
    }));
  } catch {
    return mapStatic();
  }
}

export type { StaticVideo };
