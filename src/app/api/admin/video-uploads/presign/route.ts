import { NextResponse } from "next/server";
import { createVideoUploadUrl, isR2Configured } from "@/lib/r2";

const MAX_BYTES = 50 * 1024 * 1024;
const ALLOWED = new Set(["video/mp4", "video/webm", "video/quicktime"]);

export async function POST(request: Request) {
  try {
    if (!isR2Configured()) {
      return NextResponse.json(
        {
          error:
            "R2 is not fully configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, and R2_PUBLIC_BASE_URL."
        },
        { status: 503 }
      );
    }

    const body = await request.json();
    const filename = typeof body.filename === "string" ? body.filename : "video.mp4";
    const contentType = typeof body.contentType === "string" ? body.contentType : "video/mp4";
    const sizeBytes = typeof body.sizeBytes === "number" ? body.sizeBytes : 0;

    if (!ALLOWED.has(contentType) && !contentType.startsWith("video/")) {
      return NextResponse.json({ error: "Only MP4, WebM, or MOV videos are allowed." }, { status: 400 });
    }
    if (sizeBytes > MAX_BYTES) {
      return NextResponse.json({ error: "Video must be 50MB or smaller after compression." }, { status: 400 });
    }

    const signed = await createVideoUploadUrl({ filename, contentType });
    return NextResponse.json({ ok: true, ...signed, maxBytes: MAX_BYTES });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create upload URL.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
