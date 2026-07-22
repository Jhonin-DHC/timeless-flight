import { NextResponse } from "next/server";
import { getR2ObjectStream, isAllowedMediaKey } from "@/lib/r2";

export async function GET(request: Request, context: { params: Promise<{ key: string[] }> }) {
  try {
    const { key: parts } = await context.params;
    const key = parts.map(decodeURIComponent).join("/");

    if (!isAllowedMediaKey(key)) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }

    const range = request.headers.get("range");
    const object = await getR2ObjectStream(key, range);
    if (!object.body) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }

    const headers: Record<string, string> = {
      "Content-Type": object.contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
      "Accept-Ranges": "bytes"
    };
    if (object.etag) headers.ETag = object.etag;
    if (object.contentLength != null) headers["Content-Length"] = String(object.contentLength);
    if (object.contentRange) headers["Content-Range"] = object.contentRange;

    return new NextResponse(object.body, {
      status: range ? 206 : 200,
      headers
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load media.";
    const status = /NoSuchKey|NotFound|404/i.test(message) ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
