"use client";

import { useMemo, useState } from "react";
import {
  BLOG_CATEGORIES,
  BLOG_CATEGORY_LABELS,
  BLOG_LOCALE,
  publicBlogPath,
  type AdminBlog,
  type BlogCategory,
  type BlogStatus
} from "@/lib/blog-types";

interface AdminBlogPostsTableProps {
  posts: AdminBlog[];
  onEdit: (post: AdminBlog) => void;
  onChanged: () => Promise<void> | void;
}

function postKey(post: Pick<AdminBlog, "slug" | "locale">) {
  return `${post.locale}:${post.slug}`;
}

export function AdminBlogPostsTable({ posts, onEdit, onChanged }: AdminBlogPostsTableProps) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | BlogStatus>("all");
  const [categoryFilter, setCategoryFilter] = useState<"all" | BlogCategory>("all");
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const needle = query.toLowerCase().trim();
    return posts.filter((post) => {
      const matchesQuery =
        needle.length === 0 ||
        post.title.toLowerCase().includes(needle) ||
        post.slug.toLowerCase().includes(needle);
      const matchesStatus = statusFilter === "all" || post.status === statusFilter;
      const matchesCategory = categoryFilter === "all" || post.category === categoryFilter;
      return matchesQuery && matchesStatus && matchesCategory;
    });
  }, [posts, query, statusFilter, categoryFilter]);

  const allVisibleSelected = filtered.length > 0 && filtered.every((post) => selected.includes(postKey(post)));

  const toggleAll = () => {
    if (allVisibleSelected) {
      const visible = new Set(filtered.map(postKey));
      setSelected((current) => current.filter((key) => !visible.has(key)));
      return;
    }
    setSelected((current) => [...new Set([...current, ...filtered.map(postKey)])]);
  };

  const toggleOne = (post: AdminBlog) => {
    const key = postKey(post);
    setSelected((current) => (current.includes(key) ? current.filter((item) => item !== key) : [...current, key]));
  };

  const selectedItems = selected
    .map((key) => {
      const [locale, ...slugParts] = key.split(":");
      return { locale: locale || BLOG_LOCALE, slug: slugParts.join(":") };
    })
    .filter((item) => item.slug);

  const runBulk = async (action: "publish" | "draft" | "delete") => {
    if (selectedItems.length === 0) return;
    if (action === "delete" && !window.confirm(`Delete ${selectedItems.length} post(s)? This cannot be undone.`)) return;
    setBusy(true);
    setError(null);
    const response = await fetch("/api/admin/blogs/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, items: selectedItems })
    });
    const payload = await response.json();
    setBusy(false);
    if (!response.ok) {
      setError(payload.error ?? "Bulk action failed.");
      return;
    }
    setSelected([]);
    await onChanged();
  };

  const removeOne = async (post: AdminBlog) => {
    if (!window.confirm(`Delete “${post.title}”?`)) return;
    const response = await fetch(`/api/admin/blogs/${encodeURIComponent(post.slug)}?locale=${post.locale}`, {
      method: "DELETE"
    });
    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error ?? "Failed to delete post.");
      return;
    }
    setSelected((current) => current.filter((key) => key !== postKey(post)));
    await onChanged();
  };

  const selectClass = "rounded-xl border border-white/15 bg-[#111a30] px-3 py-2 text-sm";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search title or slug"
          className="min-w-[180px] flex-1 rounded-xl border border-white/15 bg-transparent px-3 py-2 text-sm outline-none ring-[var(--brand-a)] focus:ring-2"
        />
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)} className={selectClass}>
          <option value="all">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
        <select
          value={categoryFilter}
          onChange={(event) => setCategoryFilter(event.target.value as typeof categoryFilter)}
          className={selectClass}
        >
          <option value="all">All categories</option>
          {BLOG_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {BLOG_CATEGORY_LABELS[category]}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn-gradient-secondary text-sm" disabled={busy || selectedItems.length === 0} onClick={() => void runBulk("publish")}>
          Publish selected
        </button>
        <button type="button" className="btn-gradient-secondary text-sm" disabled={busy || selectedItems.length === 0} onClick={() => void runBulk("draft")}>
          Move to draft
        </button>
        <button type="button" className="btn-gradient-secondary text-sm" disabled={busy || selectedItems.length === 0} onClick={() => void runBulk("delete")}>
          Delete selected
        </button>
      </div>
      {error ? <p className="text-sm text-red-300">{error}</p> : null}

      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-white/5 text-xs uppercase tracking-wide text-[var(--muted)]">
            <tr>
              <th className="px-3 py-2">
                <input type="checkbox" checked={allVisibleSelected} onChange={toggleAll} aria-label="Select all visible posts" />
              </th>
              <th className="px-3 py-2">Title</th>
              <th className="px-3 py-2">Category</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Updated</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((post) => (
              <tr key={postKey(post)} className="border-t border-white/10">
                <td className="px-3 py-3">
                  <input
                    type="checkbox"
                    checked={selected.includes(postKey(post))}
                    onChange={() => toggleOne(post)}
                    aria-label={`Select ${post.title}`}
                  />
                </td>
                <td className="px-3 py-3">
                  <p className="font-medium">{post.title}</p>
                  <p className="text-xs text-[var(--muted)]">/{post.slug}</p>
                </td>
                <td className="px-3 py-3 text-[var(--muted)]">{BLOG_CATEGORY_LABELS[post.category]}</td>
                <td className="px-3 py-3">
                  <span className={post.status === "published" ? "text-[var(--brand-c)]" : "text-[var(--muted)]"}>
                    {post.status}
                  </span>
                </td>
                <td className="px-3 py-3 text-[var(--muted)]">
                  {post.updatedAt ? new Date(post.updatedAt).toLocaleDateString() : "—"}
                </td>
                <td className="px-3 py-3">
                  <div className="flex flex-wrap gap-2">
                    <button type="button" className="text-xs text-[var(--brand-a)]" onClick={() => onEdit(post)}>
                      Edit
                    </button>
                    {post.status === "published" ? (
                      <a href={publicBlogPath(post.slug)} target="_blank" rel="noreferrer" className="text-xs text-[var(--brand-a)]">
                        View
                      </a>
                    ) : null}
                    <button type="button" className="text-xs text-red-300" onClick={() => void removeOne(post)}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 ? <p className="px-3 py-6 text-sm text-[var(--muted)]">No posts match these filters.</p> : null}
      </div>
    </div>
  );
}
