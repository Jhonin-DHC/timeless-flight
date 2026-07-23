import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import { normalizePublicImageUrl } from "@/lib/r2";
import { extractYoutubeVideoId } from "@/lib/youtube";
import { VideoResource } from "@/models/VideoResource";

export async function GET() {
  try {
    await connectMongo();
    const videos = await VideoResource.find().sort({ sortOrder: 1, createdAt: -1 }).lean();
    return NextResponse.json({
      videos: videos.map((video) => ({
        ...video,
        videoUrl: video.videoUrl ? normalizePublicImageUrl(video.videoUrl) : ""
      }))
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load videos.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectMongo();
    const body = await request.json();
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const videoUrl = typeof body.videoUrl === "string" ? body.videoUrl.trim() : "";
    const youtubeInput = typeof body.youtubeVideoId === "string" ? body.youtubeVideoId.trim() : "";
    const youtubeVideoId = extractYoutubeVideoId(youtubeInput) || youtubeInput;

    if (!title) {
      return NextResponse.json({ error: "Title is required." }, { status: 400 });
    }
    if (!videoUrl && !youtubeVideoId) {
      return NextResponse.json({ error: "Upload a video file or paste a YouTube URL / video ID." }, { status: 400 });
    }

    const video = await VideoResource.create({
      title,
      description: typeof body.description === "string" ? body.description.trim() : "",
      videoUrl,
      videoKey: typeof body.videoKey === "string" ? body.videoKey : "",
      contentType: typeof body.contentType === "string" ? body.contentType : "video/mp4",
      sizeBytes: typeof body.sizeBytes === "number" ? body.sizeBytes : 0,
      youtubeVideoId: youtubeVideoId || "",
      published: body.published !== false,
      featured: Boolean(body.featured),
      sortOrder: typeof body.sortOrder === "number" ? body.sortOrder : 0
    });

    return NextResponse.json({ video }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create video.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
