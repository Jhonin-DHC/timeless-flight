"use client";

import { useEffect, useState } from "react";
import { AdminBlogBuilderForm } from "@/components/admin/admin-blog-builder-form";
import { AdminBlogPostsTable } from "@/components/admin/admin-blog-posts-table";
import type { AdminBlog } from "@/lib/blog-types";

export function AdminBlogsManager() {
  const [posts, setPosts] = useState<AdminBlog[]>([]);
  const [editing, setEditing] = useState<AdminBlog | null>(null);
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
      <div>
        <h2 className="section-title">Blogs</h2>
        <p className="section-copy">
          Write markdown posts, insert images, and publish them to Resources → Blogs. Drafts stay off the public site.
        </p>
      </div>
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      <AdminBlogBuilderForm
        editing={editing}
        onSaved={async () => {
          await load();
          setEditing(null);
        }}
        onCancel={() => setEditing(null)}
      />
      <AdminBlogPostsTable
        posts={posts}
        onEdit={(post) => {
          setEditing(post);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        onChanged={load}
      />
    </div>
  );
}
