import { NextResponse } from "next/server";
import { isR2Configured, uploadResourceVideo } from "@/lib/r2";

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

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "A file is required." }, { status: 400 });
    }
    if (!ALLOWED.has(file.type) && !file.type.startsWith("video/")) {
      return NextResponse.json({ error: "Only MP4, WebM, or MOV videos are allowed." }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "Video must be 50MB or smaller after compression." }, { status: 400 });
    }

    const uploaded = await uploadResourceVideo(file);
    return NextResponse.json({ ok: true, ...uploaded });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
