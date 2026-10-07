import { NextResponse } from "next/server";
import { bulkDeleteBlogPosts, bulkSetBlogStatus } from "@/lib/blog-service";
import { isBlogStatus } from "@/lib/blog-types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const action = typeof body.action === "string" ? body.action : "";
    const items = Array.isArray(body.items)
      ? body.items
          .map((item: { slug?: string; locale?: string }) => ({
            slug: typeof item?.slug === "string" ? item.slug : "",
            locale: typeof item?.locale === "string" ? item.locale : "en"
          }))
          .filter((item: { slug: string }) => item.slug)
      : [];

    if (items.length === 0) {
      return NextResponse.json({ ok: false, error: "Select at least one post." }, { status: 400 });
    }

    if (action === "delete") {
      const result = await bulkDeleteBlogPosts(items);
      return NextResponse.json(result);
    }

    if (action === "publish" || action === "draft") {
      if (!isBlogStatus(action)) {
        return NextResponse.json({ ok: false, error: "Invalid action." }, { status: 400 });
      }
      const result = await bulkSetBlogStatus(items, action);
      return NextResponse.json(result);
    }

    return NextResponse.json({ ok: false, error: "Action must be publish, draft, or delete." }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Bulk update failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
