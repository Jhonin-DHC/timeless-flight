import { NextResponse } from "next/server";
import { guessImageContentType, isAllowedListingImage, isUploadFile } from "@/lib/listing-image-upload";
import { isR2Configured, uploadListingImage } from "@/lib/r2";

const MAX_BYTES = 12 * 1024 * 1024;

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    if (!isR2Configured()) {
      return NextResponse.json(
        {
          error:
            "Image uploads are not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, and R2_PUBLIC_BASE_URL."
        },
        { status: 503 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");
    if (!isUploadFile(file)) {
      return NextResponse.json({ error: "file is required." }, { status: 400 });
    }

    const named = file as File;
    const filename = named.name || "watch.jpg";
    if (!isAllowedListingImage({ name: filename, type: named.type })) {
      return NextResponse.json({ error: "Only JPEG, PNG, WebP, and GIF images are allowed." }, { status: 400 });
    }

    if (!file.size || file.size > MAX_BYTES) {
      return NextResponse.json({ error: "Image must be 12MB or smaller." }, { status: 400 });
    }

    const contentType = guessImageContentType({ name: filename, type: named.type });
    const uploadFile = new File([await file.arrayBuffer()], filename, { type: contentType });

    const uploaded = await uploadListingImage(uploadFile);
    return NextResponse.json({ ok: true, url: uploaded.url, key: uploaded.key });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
