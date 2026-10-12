"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AdminBlogBuilderForm } from "@/components/admin/admin-blog-builder-form";
import type { AdminBlog } from "@/lib/blog-types";

export function AdminBlogEditor({ initialPost }: { initialPost: AdminBlog | null }) {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/blogs" className="text-sm text-[var(--brand-a)]">
          ← All posts
        </Link>
        <h2 className="section-title mt-2">{initialPost ? "Edit post" : "New post"}</h2>
        <p className="section-copy">
          Save drafts, preview them as a signed-in admin, then publish when the story is ready.
        </p>
      </div>
      <AdminBlogBuilderForm
        editing={initialPost}
        onSaved={async (post) => {
          router.replace(`/admin/blogs/${post.slug}`);
          router.refresh();
        }}
        onCancel={() => router.push("/admin/blogs")}
      />
    </div>
  );
}
