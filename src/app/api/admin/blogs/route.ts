import { NextResponse } from "next/server";
import { createBlogPost, listAdminBlogs } from "@/lib/blog-service";
import { getSessionEmail } from "@/lib/auth";

export async function GET() {
  try {
    const posts = await listAdminBlogs();
    return NextResponse.json({ ok: true, posts });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load posts.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = (await getSessionEmail()) || "";
    const result = await createBlogPost(body, email);
    if ("error" in result && result.error) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
    }
    return NextResponse.json({ ok: true, post: result.post }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create post.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
