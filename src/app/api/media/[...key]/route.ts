import { NextResponse } from "next/server";
import { getR2ObjectStream, isAllowedMediaKey } from "@/lib/r2";

export async function GET(_request: Request, context: { params: Promise<{ key: string[] }> }) {
  try {
    const { key: parts } = await context.params;
    const key = parts.map(decodeURIComponent).join("/");

    if (!isAllowedMediaKey(key)) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }

    const object = await getR2ObjectStream(key);
    if (!object.body) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }

    return new NextResponse(object.body, {
      headers: {
        "Content-Type": object.contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
        ...(object.etag ? { ETag: object.etag } : {})
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load media.";
    const status = /NoSuchKey|NotFound|404/i.test(message) ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
