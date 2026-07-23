import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import { extractYoutubeVideoId } from "@/lib/youtube";
import { VideoResource } from "@/models/VideoResource";

interface RouteProps {
  params: Promise<{ id: string }>;
}

export async function PUT(request: Request, { params }: RouteProps) {
  try {
    const { id } = await params;
    await connectMongo();
    const body = await request.json();
    const update: Record<string, unknown> = {};
    if (typeof body.title === "string") update.title = body.title.trim();
    if (typeof body.description === "string") update.description = body.description.trim();
    if (typeof body.videoUrl === "string") update.videoUrl = body.videoUrl.trim();
    if (typeof body.videoKey === "string") update.videoKey = body.videoKey;
    if (typeof body.contentType === "string") update.contentType = body.contentType;
    if (typeof body.sizeBytes === "number") update.sizeBytes = body.sizeBytes;
    if (typeof body.youtubeVideoId === "string") {
      const parsed = extractYoutubeVideoId(body.youtubeVideoId.trim());
      update.youtubeVideoId = parsed || body.youtubeVideoId.trim();
    }
    if (typeof body.published === "boolean") update.published = body.published;
    if (typeof body.featured === "boolean") update.featured = body.featured;
    if (typeof body.sortOrder === "number") update.sortOrder = body.sortOrder;

    const video = await VideoResource.findByIdAndUpdate(id, update, { new: true });
    if (!video) {
      return NextResponse.json({ error: "Video not found." }, { status: 404 });
    }
    return NextResponse.json({ video });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update video.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteProps) {
  try {
    const { id } = await params;
    await connectMongo();
    const video = await VideoResource.findByIdAndDelete(id);
    if (!video) {
      return NextResponse.json({ error: "Video not found." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete video.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
