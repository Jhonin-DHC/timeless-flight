import { NextResponse } from "next/server";
import { guessImageContentType, isAllowedListingImage, isUploadFile } from "@/lib/listing-image-upload";
import { isR2Configured, uploadBlogImage } from "@/lib/r2";

const MAX_BYTES = 12 * 1024 * 1024;

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    if (!isR2Configured()) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "R2 is not fully configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, and a real R2_PUBLIC_BASE_URL."
        },
        { status: 503 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");
    if (!isUploadFile(file)) {
      return NextResponse.json({ ok: false, error: "A photo file is required." }, { status: 400 });
    }

    const filename = file.name || "image.jpg";
    if (!isAllowedListingImage({ name: filename, type: file.type })) {
      return NextResponse.json({ ok: false, error: "Only JPEG, PNG, WebP, and GIF images are allowed." }, { status: 400 });
    }
    if (!file.size || file.size > MAX_BYTES) {
      return NextResponse.json({ ok: false, error: "Image must be 12MB or smaller." }, { status: 400 });
    }

    const slug = String(formData.get("slug") || "untitled");
    const locale = String(formData.get("locale") || "en");
    const contentType = guessImageContentType({ name: filename, type: file.type });
    const uploadFile = new File([await file.arrayBuffer()], filename, { type: contentType });
    const uploaded = await uploadBlogImage(uploadFile, { slug, locale });

    return NextResponse.json({ ok: true, key: uploaded.key, publicUrl: uploaded.url, url: uploaded.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
