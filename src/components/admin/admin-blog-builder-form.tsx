"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BlogArticle } from "@/components/blog/blog-article";
import { RemoteImage } from "@/components/remote-image";
import { bodyLooksLikeHtml } from "@/lib/blog-cover";
import { prepareListingImage } from "@/lib/listing-image-upload";
import { estimateReadingMinutes, slugifyBlogTitle } from "@/lib/blog-slug";
import {
  BLOG_CATEGORIES,
  BLOG_CATEGORY_LABELS,
  BLOG_LOCALE,
  publicBlogPath,
  type AdminBlog,
  type BlogCategory,
  type BlogImage,
  type BlogStatus
} from "@/lib/blog-types";

interface AdminBlogBuilderFormProps {
  editing: AdminBlog | null;
  onSaved: (post: AdminBlog) => Promise<void> | void;
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
  coverUrl: string;
  coverAlt: string;
  images: BlogImage[];
}

const emptyForm: FormState = {
  title: "",
  slug: "",
  summary: "",
  category: "buying-guides",
  body: "",
  status: "draft",
  publishedAt: "",
  coverUrl: "",
  coverAlt: "",
  images: []
};

function toDatetimeLocal(iso: string | null) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formFromPost(post: AdminBlog | null): FormState {
  if (!post) return emptyForm;
  return {
    title: post.title,
    slug: post.slug,
    summary: post.summary,
    category: post.category,
    body: post.body,
    status: post.status,
    publishedAt: toDatetimeLocal(post.publishedAt),
    coverUrl: post.coverUrl,
    coverAlt: post.coverAlt,
    images: post.images || []
  };
}

function snapshot(form: FormState) {
  return JSON.stringify(form);
}

function escapeAttr(value: string) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

function imageSnippet(body: string, image: BlogImage) {
  const alt = escapeAttr(image.alt || "image");
  const caption = escapeAttr(image.caption);
  if (bodyLooksLikeHtml(body) || !body.trim()) {
    return caption
      ? `\n<figure><img src="${image.url}" alt="${alt}" /><figcaption>${caption}</figcaption></figure>\n`
      : `\n<p><img src="${image.url}" alt="${alt}" /></p>\n`;
  }
  return caption ? `\n![${alt}](${image.url})\n*${image.caption}*\n` : `\n![${alt}](${image.url})\n`;
}

export function AdminBlogBuilderForm({ editing, onSaved, onCancel }: AdminBlogBuilderFormProps) {
  const [form, setForm] = useState<FormState>(() => formFromPost(editing));
  const [slugTouched, setSlugTouched] = useState(Boolean(editing));
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const savedSnapshot = useRef(snapshot(formFromPost(editing)));

  useEffect(() => {
    const next = formFromPost(editing);
    setForm(next);
    savedSnapshot.current = snapshot(next);
    setSlugTouched(Boolean(editing));
    setError(null);
    setStatus(null);
  }, [editing]);

  const dirty = useMemo(() => snapshot(form) !== savedSnapshot.current, [form]);

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  useEffect(() => {
    if (!dirty) return;
    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest("a");
      if (!anchor) return;
      if (anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
      if (!window.confirm("You have unsaved changes. Leave this page?")) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [dirty]);

  const updateImage = (index: number, patch: Partial<BlogImage>) => {
    setForm((current) => {
      const images = current.images.map((image, imageIndex) => (imageIndex === index ? { ...image, ...patch } : image));
      const coverAlt = current.coverUrl === images[index]?.url && patch.alt !== undefined ? patch.alt : current.coverAlt;
      return { ...current, images, coverAlt: coverAlt || current.coverAlt };
    });
  };

  const moveImage = (index: number, direction: -1 | 1) => {
    setForm((current) => {
      const next = index + direction;
      if (next < 0 || next >= current.images.length) return current;
      const images = [...current.images];
      const [item] = images.splice(index, 1);
      images.splice(next, 0, item);
      return { ...current, images };
    });
  };

  const removeImage = (index: number) => {
    setForm((current) => {
      const removed = current.images[index];
      const images = current.images.filter((_, imageIndex) => imageIndex !== index);
      const coverUrl = current.coverUrl === removed?.url ? images[0]?.url || "" : current.coverUrl;
      const coverAlt = current.coverUrl === removed?.url ? images[0]?.alt || "" : current.coverAlt;
      return { ...current, images, coverUrl, coverAlt };
    });
  };

  const setCover = (image: BlogImage) => {
    setForm((current) => ({ ...current, coverUrl: image.url, coverAlt: image.alt || current.coverAlt }));
  };

  const insertIntoBody = (image: BlogImage) => {
    setForm((current) => ({ ...current, body: `${current.body}${imageSnippet(current.body, image)}` }));
    setStatus("Image added to the body.");
  };

  const uploadImage = async (fileList: FileList | null) => {
    const originals = Array.from(fileList ?? []);
    if (originals.length === 0) return;
    if (originals.length > 40) {
      setError("Select up to 40 photos at a time. You can add more after that.");
      return;
    }

    setUploading(true);
    setError(null);
    const failures: string[] = [];
    const uploaded: BlogImage[] = [];

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
          uploaded.push({
            url: payload.publicUrl as string,
            alt: original.name.replace(/\.[^.]+$/, "") || "image",
            caption: ""
          });
        } catch (uploadError) {
          failures.push(`${original.name}: ${uploadError instanceof Error ? uploadError.message : "Upload failed."}`);
        }
      }
      if (uploaded.length > 0) {
        setForm((current) => ({
          ...current,
          images: [...current.images, ...uploaded],
          coverUrl: current.coverUrl || uploaded[0].url,
          coverAlt: current.coverAlt || uploaded[0].alt
        }));
        setStatus(uploaded.length === 1 ? "Image added to this post." : `${uploaded.length} images added to this post.`);
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
    const post = result.post as AdminBlog;
    savedSnapshot.current = snapshot(formFromPost(post));
    setForm(formFromPost(post));
    setSlugTouched(true);
    setStatus(editing ? "Post updated." : "Post created.");
    await onSaved(post);
  };

  const leave = () => {
    if (dirty && !window.confirm("You have unsaved changes. Leave this page?")) return;
    onCancel();
  };

  const previewPost = {
    slug: form.slug || "preview",
    locale: BLOG_LOCALE,
    title: form.title || "Untitled post",
    summary: form.summary,
    category: form.category,
    categoryLabel: BLOG_CATEGORY_LABELS[form.category],
    body: form.body,
    publishedAt: form.publishedAt ? new Date(form.publishedAt).toISOString() : null,
    readingMinutes: estimateReadingMinutes(form.body),
    coverUrl: form.coverUrl,
    coverAlt: form.coverAlt,
    images: form.images
  };

  const inputClass = "w-full rounded-xl border border-white/15 bg-transparent px-3 py-2 text-sm outline-none ring-[var(--brand-a)] focus:ring-2";

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="glass-card space-y-4">
        <div>
          <h3 className="text-lg font-semibold">{editing ? "Edit post" : "New post"}</h3>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Add photos to the list, choose a cover, then insert the ones you need into the body. Drafts can be previewed
            on the public page while you are signed in.
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
            {editing && form.slug !== editing.slug ? (
              <span className="block text-xs text-[var(--brand-c)]">The old URL will redirect to this slug after save.</span>
            ) : null}
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
              rows={16}
              placeholder={"<p>Paragraph</p>\n<h2>Heading</h2>\n<p>The <strong>watch</strong> is...</p>"}
              className={`${inputClass} min-h-64 font-mono text-[13px] leading-6`}
            />
          </label>
        </div>

        <div className="space-y-3 rounded-2xl border border-white/10 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-semibold">Images</h4>
              <p className="text-xs text-[var(--muted)]">Upload first, then set a cover, caption, or insert into the body.</p>
            </div>
            <label className="btn-gradient-secondary cursor-pointer text-sm">
              {uploading ? "Uploading..." : "Add images"}
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
          </div>
          {form.images.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No images yet.</p>
          ) : (
            <ul className="space-y-3">
              {form.images.map((image, index) => {
                const isCover = form.coverUrl === image.url;
                return (
                  <li key={`${image.url}-${index}`} className="rounded-xl border border-white/10 p-3">
                    <div className="grid gap-3 sm:grid-cols-[96px_minmax(0,1fr)]">
                      <div className="relative h-24 overflow-hidden rounded-lg bg-black/20">
                        <RemoteImage src={image.url} alt={image.alt || ""} className="object-cover" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          {isCover ? <span className="rounded-full bg-[var(--brand-c)]/20 px-2 py-0.5 text-[var(--brand-c)]">Cover</span> : null}
                          <button type="button" className="text-[var(--brand-a)]" onClick={() => setCover(image)}>
                            Set cover
                          </button>
                          <button type="button" className="text-[var(--brand-a)]" onClick={() => insertIntoBody(image)}>
                            Insert into body
                          </button>
                          <button type="button" className="text-[var(--brand-a)] disabled:opacity-40" disabled={index === 0} onClick={() => moveImage(index, -1)}>
                            Up
                          </button>
                          <button
                            type="button"
                            className="text-[var(--brand-a)] disabled:opacity-40"
                            disabled={index === form.images.length - 1}
                            onClick={() => moveImage(index, 1)}
                          >
                            Down
                          </button>
                          <button type="button" className="text-red-300" onClick={() => removeImage(index)}>
                            Remove
                          </button>
                        </div>
                        <input
                          value={image.alt}
                          onChange={(event) => updateImage(index, { alt: event.target.value })}
                          placeholder="Alt text"
                          className={inputClass}
                        />
                        <input
                          value={image.caption}
                          onChange={(event) => updateImage(index, { caption: event.target.value })}
                          placeholder="Caption"
                          className={inputClass}
                        />
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={() => void save()} disabled={saving || uploading} className="btn-gradient-primary text-sm">
            {saving ? "Saving..." : editing ? "Update post" : "Create post"}
          </button>
          <button type="button" onClick={leave} className="btn-gradient-secondary text-sm">
            Back to list
          </button>
          {form.slug ? (
            <a href={publicBlogPath(form.slug)} target="_blank" rel="noreferrer" className="text-sm text-[var(--brand-a)]">
              {form.status === "published" ? "View live post" : "Preview draft"}
            </a>
          ) : null}
          {dirty ? <span className="text-xs text-[var(--brand-c)]">Unsaved changes</span> : null}
        </div>
        {error ? <p className="text-sm text-red-300">{error}</p> : null}
        {status ? <p className="text-sm text-[var(--brand-c)]">{status}</p> : null}
      </div>

      <div className="glass-card space-y-3 overflow-hidden">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold">Preview</h3>
          <p className="text-xs text-[var(--muted)]">How the public page will look</p>
        </div>
        <div className="max-h-[min(80vh,960px)] overflow-auto rounded-2xl border border-white/10 p-4">
          <div className="pointer-events-none">
            <BlogArticle post={previewPost} draftBanner={form.status !== "published"} />
          </div>
        </div>
      </div>
    </div>
  );
}
