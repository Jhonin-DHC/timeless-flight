import { NextResponse } from "next/server";
import { isR2Configured, uploadListingImage } from "@/lib/r2";

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export async function POST(request: Request) {
  try {
    if (!isR2Configured()) {
      return NextResponse.json(
        { error: "R2 is not fully configured. Set R2 credentials and R2_PUBLIC_BASE_URL." },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "A file is required." }, { status: 400 });
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ error: "Only JPEG, PNG, WebP, and GIF images are allowed." }, { status: 400 });
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "Image must be 8MB or smaller." }, { status: 400 });
    }

    const uploaded = await uploadListingImage(file);
    return NextResponse.json({ ok: true, ...uploaded });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
