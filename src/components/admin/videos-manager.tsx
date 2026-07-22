"use client";

import { FormEvent, useEffect, useState } from "react";
import { prepareVideoForUpload } from "@/lib/compress-video";
import { toDisplayMediaUrl } from "@/lib/r2-display";

interface VideoRow {
  _id: string;
  title: string;
  description: string;
  videoUrl: string;
  videoKey: string;
  contentType: string;
  sizeBytes: number;
  published: boolean;
  sortOrder: number;
}

const emptyForm = {
  title: "",
  description: "",
  videoUrl: "",
  videoKey: "",
  contentType: "video/mp4",
  sizeBytes: 0,
  published: true,
  sortOrder: 0
};

function formatMb(bytes: number) {
  if (!bytes) return "—";
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function VideosManager() {
  const [videos, setVideos] = useState<VideoRow[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const response = await fetch("/api/admin/videos");
    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error ?? "Failed to load videos.");
      return;
    }
    setVideos(payload.videos ?? []);
  };

  useEffect(() => {
    void load();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
    setStatus(null);
  };

  const uploadVideo = async (fileList: FileList | null) => {
    const file = fileList?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    setStatus("Preparing video…");

    try {
      const prepared = await prepareVideoForUpload(file);
      if (prepared.note) setStatus(prepared.note);
      else setStatus("Uploading…");

      const signResponse = await fetch("/api/admin/video-uploads/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: prepared.file.name,
          contentType: prepared.file.type || "video/mp4",
          sizeBytes: prepared.file.size
        })
      });
      const signed = await signResponse.json();
      if (!signResponse.ok || !signed.uploadUrl) {
        throw new Error(signed.error ?? "Could not start upload.");
      }

      const putResponse = await fetch(signed.uploadUrl as string, {
        method: "PUT",
        headers: {
          "Content-Type": (signed.contentType as string) || prepared.file.type || "video/mp4"
        },
        body: prepared.file
      });
      if (!putResponse.ok) {
        throw new Error(
          `Direct upload failed (${putResponse.status}). Add CORS on the R2 bucket allowing PUT from this site, then retry.`
        );
      }

      setForm((current) => ({
        ...current,
        videoUrl: signed.publicUrl as string,
        videoKey: (signed.key as string) || "",
        contentType: (signed.contentType as string) || prepared.file.type || "video/mp4",
        sizeBytes: prepared.file.size
      }));
      setStatus(prepared.compressed ? `${prepared.note} Upload complete.` : "Upload complete.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
      setStatus(null);
    } finally {
      setUploading(false);
    }
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    if (!form.title.trim() || !form.videoUrl) {
      setError("Add a title and upload a video before saving.");
      setSaving(false);
      return;
    }

    const response = await fetch(editingId ? `/api/admin/videos/${editingId}` : "/api/admin/videos", {
      method: editingId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    const payload = await response.json();
    setSaving(false);
    if (!response.ok) {
      setError(payload.error ?? "Save failed.");
      return;
    }
    resetForm();
    await load();
  };

  const remove = async (id: string) => {
    if (!window.confirm("Delete this video resource?")) return;
    const response = await fetch(`/api/admin/videos/${id}`, { method: "DELETE" });
    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error ?? "Delete failed.");
      return;
    }
    if (editingId === id) resetForm();
    await load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Videos</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Upload videos for the public Resources → Videos page. Files over 50MB are auto-compressed in the browser when
          possible (target ≤50MB, ~720p).
        </p>
      </div>

      <form onSubmit={save} className="glass-card space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block space-y-1 text-sm">
            <span>Title</span>
            <input
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              className="w-full rounded-xl border border-white/15 bg-transparent px-3 py-2"
              required
            />
          </label>
          <label className="block space-y-1 text-sm">
            <span>Sort order</span>
            <input
              type="number"
              value={form.sortOrder}
              onChange={(event) =>
                setForm((current) => ({ ...current, sortOrder: Number(event.target.value) || 0 }))
              }
              className="w-full rounded-xl border border-white/15 bg-transparent px-3 py-2"
            />
          </label>
        </div>

        <label className="block space-y-1 text-sm">
          <span>Description</span>
          <textarea
            value={form.description}
            onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
            rows={3}
            className="w-full rounded-xl border border-white/15 bg-transparent px-3 py-2"
          />
        </label>

        <div className="space-y-2">
          <p className="text-sm font-medium">Video file (MP4 / WebM / MOV · max 50MB after compress)</p>
          <input
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            disabled={uploading}
            onChange={(event) => {
              void uploadVideo(event.target.files);
              event.target.value = "";
            }}
            className="text-sm"
          />
          {status ? <p className="text-xs text-[var(--brand-c)]">{status}</p> : null}
          {form.videoUrl ? (
            <div className="space-y-2 rounded-xl border border-white/10 p-3">
              <p className="text-xs text-[var(--muted)]">
                {formatMb(form.sizeBytes)} · {form.contentType}
              </p>
              <video
                key={form.videoUrl}
                src={toDisplayMediaUrl(form.videoUrl)}
                controls
                playsInline
                className="max-h-64 w-full rounded-lg bg-black"
              />
            </div>
          ) : null}
        </div>

        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.published}
            onChange={(event) => setForm((current) => ({ ...current, published: event.target.checked }))}
          />
          Published on /resources/videos
        </label>

        <div className="flex flex-wrap gap-3">
          <button type="submit" disabled={saving || uploading} className="btn-gradient-primary text-sm">
            {saving ? "Saving..." : editingId ? "Update video" : "Publish video"}
          </button>
          {editingId ? (
            <button type="button" onClick={resetForm} className="btn-gradient-secondary text-sm">
              Cancel edit
            </button>
          ) : null}
        </div>
      </form>

      {error ? <p className="text-sm text-red-300">{error}</p> : null}

      <div className="space-y-3">
        {videos.map((video) => (
          <div key={video._id} className="glass-card flex flex-wrap items-start gap-4">
            <div className="w-full max-w-xs shrink-0 overflow-hidden rounded-lg bg-black sm:w-48">
              <video
                src={toDisplayMediaUrl(video.videoUrl)}
                controls
                playsInline
                preload="metadata"
                className="aspect-video w-full"
              />
            </div>
            <div className="min-w-[220px] flex-1">
              <p className="font-medium">{video.title}</p>
              <p className="text-sm text-[var(--muted)]">
                {video.published ? "Published" : "Draft"} · {formatMb(video.sizeBytes)}
              </p>
              <p className="mt-1 text-sm text-[var(--muted)]">{video.description || "No description"}</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className="btn-gradient-secondary text-sm"
                onClick={() => {
                  setEditingId(video._id);
                  setForm({
                    title: video.title,
                    description: video.description || "",
                    videoUrl: video.videoUrl,
                    videoKey: video.videoKey || "",
                    contentType: video.contentType || "video/mp4",
                    sizeBytes: video.sizeBytes || 0,
                    published: video.published,
                    sortOrder: video.sortOrder || 0
                  });
                  setError(null);
                  setStatus(null);
                }}
              >
                Edit
              </button>
              <button type="button" className="text-sm text-red-300" onClick={() => void remove(video._id)}>
                Delete
              </button>
            </div>
          </div>
        ))}
        {videos.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No videos yet. Upload one to populate the public page.</p>
        ) : null}
      </div>
    </div>
  );
}
