"use client";

import { useEffect, useState } from "react";
import { bodyLooksLikeHtml } from "@/lib/blog-cover";
import { prepareListingImage } from "@/lib/listing-image-upload";
import { slugifyBlogTitle } from "@/lib/blog-slug";
import {
  BLOG_CATEGORIES,
  BLOG_CATEGORY_LABELS,
  BLOG_LOCALE,
  publicBlogPath,
  type AdminBlog,
  type BlogCategory,
  type BlogStatus
} from "@/lib/blog-types";

interface AdminBlogBuilderFormProps {
  editing: AdminBlog | null;
  onSaved: () => Promise<void> | void;
  onCancel: () => void;
}

interface FormState {
  title: string;
  slug: string;
  summary: string;
  category: BlogCategory;
  body: string;
  status: BlogStatus;
  publishedAt: string;
}

const emptyForm: FormState = {
  title: "",
  slug: "",
  summary: "",
  category: "buying-guides",
  body: "",
  status: "draft",
  publishedAt: ""
};

function toDatetimeLocal(iso: string | null) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function AdminBlogBuilderForm({ editing, onSaved, onCancel }: AdminBlogBuilderFormProps) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [slugTouched, setSlugTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!editing) {
      setForm(emptyForm);
      setSlugTouched(false);
      setError(null);
      setStatus(null);
      return;
    }
    setForm({
      title: editing.title,
      slug: editing.slug,
      summary: editing.summary,
      category: editing.category,
      body: editing.body,
      status: editing.status,
      publishedAt: toDatetimeLocal(editing.publishedAt)
    });
    setSlugTouched(true);
    setError(null);
    setStatus(null);
  }, [editing]);

  const uploadImage = async (fileList: FileList | null) => {
    const originals = Array.from(fileList ?? []);
    if (originals.length === 0) return;
    if (originals.length > 40) {
      setError("Select up to 40 photos at a time. You can insert more after that.");
      return;
    }

    setUploading(true);
    setError(null);
    const failures: string[] = [];
    let nextBody = form.body;
    let inserted = 0;

    try {
      for (const original of originals) {
        try {
          const file = await prepareListingImage(original);
          const payloadBody = new FormData();
          payloadBody.append("file", file);
          payloadBody.append("slug", form.slug || slugifyBlogTitle(form.title) || "untitled");
          payloadBody.append("locale", BLOG_LOCALE);
          const response = await fetch("/api/admin/blogs/upload-image", { method: "POST", body: payloadBody });
          const payload = await response.json();
          if (!response.ok || !payload.publicUrl) {
            failures.push(`${original.name}: ${payload.error ?? "Upload failed."}`);
            continue;
          }
          const alt = original.name.replace(/\.[^.]+$/, "") || "image";
          const url = payload.publicUrl as string;
          const snippet = bodyLooksLikeHtml(nextBody)
            ? `\n<p><img src="${url}" alt="${alt}" /></p>\n`
            : `\n![${alt}](${url})\n`;
          nextBody = `${nextBody}${snippet}`;
          inserted += 1;
        } catch (uploadError) {
          failures.push(`${original.name}: ${uploadError instanceof Error ? uploadError.message : "Upload failed."}`);
        }
      }
      setForm((current) => ({ ...current, body: nextBody }));
      if (inserted > 0) {
        setStatus(inserted === 1 ? "Image inserted into the body." : `${inserted} images inserted into the body.`);
      }
      if (failures.length > 0) setError(failures.join(" "));
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    setStatus(null);
    const payload = {
      ...form,
      locale: BLOG_LOCALE,
      publishedAt: form.publishedAt ? new Date(form.publishedAt).toISOString() : null
    };
    const response = await fetch(editing ? `/api/admin/blogs/${encodeURIComponent(editing.slug)}?locale=${BLOG_LOCALE}` : "/api/admin/blogs", {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    setSaving(false);
    if (!response.ok) {
      setError(result.error ?? "Failed to save post.");
      return;
    }
    setStatus(editing ? "Post updated." : "Post created.");
    await onSaved();
    if (!editing) {
      setForm(emptyForm);
      setSlugTouched(false);
    }
  };

  const inputClass = "w-full rounded-xl border border-white/15 bg-transparent px-3 py-2 text-sm outline-none ring-[var(--brand-a)] focus:ring-2";

  return (
    <div className="glass-card space-y-4">
      <div>
        <h3 className="text-lg font-semibold">{editing ? "Edit post" : "New post"}</h3>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Paste HTML or markdown. Tags like &lt;p&gt;, &lt;h2&gt;, &lt;strong&gt;, and &lt;img&gt; render on the public
          page. Insert as many photos as the story needs (up to 40 at a time). The first image becomes the cover.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="block space-y-1 text-sm md:col-span-2">
          <span className="text-[var(--muted)]">Title</span>
          <input
            value={form.title}
            onChange={(event) => {
              const title = event.target.value;
              setForm((current) => ({
                ...current,
                title,
                slug: slugTouched ? current.slug : slugifyBlogTitle(title)
              }));
            }}
            className={inputClass}
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-[var(--muted)]">Slug</span>
          <input
            value={form.slug}
            onChange={(event) => {
              setSlugTouched(true);
              setForm({ ...form, slug: slugifyBlogTitle(event.target.value) || event.target.value });
            }}
            className={inputClass}
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-[var(--muted)]">Category</span>
          <select
            value={form.category}
            onChange={(event) => setForm({ ...form, category: event.target.value as BlogCategory })}
            className="w-full rounded-xl border border-white/15 bg-[#111a30] px-3 py-2 text-sm"
          >
            {BLOG_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {BLOG_CATEGORY_LABELS[category]}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-[var(--muted)]">Status</span>
          <select
            value={form.status}
            onChange={(event) => setForm({ ...form, status: event.target.value as BlogStatus })}
            className="w-full rounded-xl border border-white/15 bg-[#111a30] px-3 py-2 text-sm"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-[var(--muted)]">Publish date</span>
          <input
            type="datetime-local"
            value={form.publishedAt}
            onChange={(event) => setForm({ ...form, publishedAt: event.target.value })}
            className={inputClass}
          />
        </label>
        <label className="block space-y-1 text-sm md:col-span-2">
          <span className="text-[var(--muted)]">Summary</span>
          <textarea
            value={form.summary}
            onChange={(event) => setForm({ ...form, summary: event.target.value })}
            rows={2}
            className={inputClass}
          />
        </label>
        <label className="block space-y-1 text-sm md:col-span-2">
          <span className="text-[var(--muted)]">Body (HTML or markdown)</span>
          <textarea
            value={form.body}
            onChange={(event) => setForm({ ...form, body: event.target.value })}
            rows={18}
            placeholder={'<p>Paragraph</p>\n<h2>Heading</h2>\n<p>The <strong>watch</strong> is...</p>'}
            className={`${inputClass} min-h-64 font-mono text-[13px] leading-6`}
          />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="btn-gradient-secondary cursor-pointer text-sm">
          {uploading ? "Uploading..." : "Insert images"}
          <input
            type="file"
            accept="image/*,.jpg,.jpeg,.png,.webp,.gif"
            multiple
            className="hidden"
            disabled={uploading}
            onChange={(event) => {
              void uploadImage(event.target.files);
              event.target.value = "";
            }}
          />
        </label>
        <button type="button" onClick={() => void save()} disabled={saving || uploading} className="btn-gradient-primary text-sm">
          {saving ? "Saving..." : editing ? "Update post" : "Create post"}
        </button>
        {editing ? (
          <button type="button" onClick={onCancel} className="btn-gradient-secondary text-sm">
            Cancel edit
          </button>
        ) : null}
        {form.status === "published" && form.slug ? (
          <a href={publicBlogPath(form.slug)} target="_blank" rel="noreferrer" className="text-sm text-[var(--brand-a)]">
            Preview published post
          </a>
        ) : null}
      </div>
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      {status ? <p className="text-sm text-[var(--brand-c)]">{status}</p> : null}
    </div>
  );
}
