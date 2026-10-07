import { NextResponse } from "next/server";
import { getSessionEmail } from "@/lib/auth";
import { BLOG_LOCALE } from "@/lib/blog-types";
import { deleteBlogPost, getAdminBlogBySlug, updateBlogPost } from "@/lib/blog-service";

interface RouteProps {
  params: Promise<{ slug: string }>;
}

function localeFrom(_request: Request) {
  return BLOG_LOCALE;
}

export async function GET(request: Request, { params }: RouteProps) {
  try {
    const { slug } = await params;
    const post = await getAdminBlogBySlug(slug, localeFrom(request));
    if (!post) return NextResponse.json({ ok: false, error: "Post not found." }, { status: 404 });
    return NextResponse.json({ ok: true, post });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load post.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: RouteProps) {
  try {
    const { slug } = await params;
    const body = await request.json();
    const email = (await getSessionEmail()) || "";
    const result = await updateBlogPost(slug, { ...body, locale: localeFrom(request) }, email);
    if ("error" in result && result.error) {
      const status = result.error === "Post not found." ? 404 : 400;
      return NextResponse.json({ ok: false, error: result.error }, { status });
    }
    return NextResponse.json({ ok: true, post: result.post });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update post.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteProps) {
  try {
    const { slug } = await params;
    const result = await deleteBlogPost(slug, localeFrom(request));
    if ("error" in result && result.error) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete post.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
