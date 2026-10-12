"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminBlogPostsTable } from "@/components/admin/admin-blog-posts-table";
import type { AdminBlog } from "@/lib/blog-types";

export function AdminBlogsManager() {
  const router = useRouter();
  const [posts, setPosts] = useState<AdminBlog[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    const response = await fetch("/api/admin/blogs");
    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error ?? "Failed to load posts.");
      return;
    }
    setPosts(payload.posts ?? []);
    setError(null);
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="section-title">Blogs</h2>
          <p className="section-copy">Write, preview drafts, and publish posts to Resources → Blogs.</p>
        </div>
        <Link href="/admin/blogs/new" className="btn-gradient-primary text-sm">
          New post
        </Link>
      </div>
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      <AdminBlogPostsTable
        posts={posts}
        onEdit={(post) => router.push(`/admin/blogs/${post.slug}`)}
        onChanged={load}
      />
    </div>
  );
}
