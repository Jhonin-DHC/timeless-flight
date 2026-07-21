"use client";

import { useEffect, useState } from "react";
import { RemoteImage } from "@/components/remote-image";

interface ListingRow {
  _id: string;
  slug: string;
  name: string;
  brand: string;
  condition: "New" | "Excellent" | "Very Good";
  year: number;
  priceUsd: number;
  imageUrl: string;
  imageUrls: string[];
  description: string;
  published: boolean;
}

const emptyForm: Omit<ListingRow, "_id"> = {
  slug: "",
  name: "",
  brand: "",
  condition: "Excellent",
  year: new Date().getFullYear(),
  priceUsd: 0,
  imageUrl: "",
  imageUrls: [],
  description: "",
  published: true
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function ListingsManager() {
  const [listings, setListings] = useState<ListingRow[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const response = await fetch("/api/admin/listings");
    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error ?? "Failed to load listings.");
      return;
    }
    setListings(
      (payload.listings ?? []).map((listing: ListingRow & { imageUrls?: string[] }) => ({
        ...listing,
        imageUrls: Array.isArray(listing.imageUrls) ? listing.imageUrls : []
      }))
    );
  };

  useEffect(() => {
    void load();
  }, []);

  const uploadFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    setUploading(true);
    setError(null);

    const uploadedUrls: string[] = [];
    const failures: string[] = [];
    for (const file of fileArray) {
      try {
        const body = new FormData();
        body.append("file", file);
        const response = await fetch("/api/admin/uploads", {
          method: "POST",
          body
        });
        const payload = await response.json();
        if (!response.ok || !payload.url) {
          failures.push(`${file.name}: ${payload.error ?? "Upload failed."}`);
          continue;
        }
        uploadedUrls.push(payload.url as string);
      } catch {
        failures.push(`${file.name}: Network error while uploading.`);
      }
    }

    if (uploadedUrls.length > 0) {
      setForm((current) => {
        const nextUrls = [...uploadedUrls];
        if (!current.imageUrl && nextUrls.length > 0) {
          const [main, ...rest] = nextUrls;
          return {
            ...current,
            imageUrl: main,
            imageUrls: [...current.imageUrls, ...rest]
          };
        }
        return {
          ...current,
          imageUrls: [...current.imageUrls, ...nextUrls]
        };
      });
    }

    setUploading(false);
    if (failures.length > 0) {
      const prefix =
        uploadedUrls.length > 0
          ? `${uploadedUrls.length} uploaded. Some failed: `
          : "Image upload failed: ";
      setError(`${prefix}${failures.join(" ")}`);
    }
  };

  const makeMain = (url: string) => {
    setForm((current) => {
      if (current.imageUrl === url) return current;
      const others = [current.imageUrl, ...current.imageUrls].filter(Boolean).filter((item) => item !== url);
      return {
        ...current,
        imageUrl: url,
        imageUrls: others
      };
    });
  };

  const removeImage = (url: string) => {
    setForm((current) => {
      if (current.imageUrl === url) {
        const [nextMain, ...rest] = current.imageUrls;
        return {
          ...current,
          imageUrl: nextMain ?? "",
          imageUrls: rest
        };
      }
      return {
        ...current,
        imageUrls: current.imageUrls.filter((item) => item !== url)
      };
    });
  };

  const save = async () => {
    setSaving(true);
    setError(null);

    if (!form.name || !form.slug || !form.brand || !form.imageUrl) {
      setError("Name, slug, brand, and at least one image (main/thumbnail) are required.");
      setSaving(false);
      return;
    }

    const response = await fetch(editingId ? `/api/admin/listings/${editingId}` : "/api/admin/listings", {
      method: editingId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        storefrontProductId: form.slug,
        imageUrls: form.imageUrls.filter((url) => url && url !== form.imageUrl)
      })
    });
    const payload = await response.json();
    setSaving(false);

    if (!response.ok) {
      setError(payload.error ?? "Failed to save listing.");
      return;
    }

    setForm(emptyForm);
    setEditingId(null);
    await load();
  };

  const remove = async (id: string) => {
    await fetch(`/api/admin/listings/${id}`, { method: "DELETE" });
    await load();
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setError(null);
  };

  const allImages = form.imageUrl ? [form.imageUrl, ...form.imageUrls] : [...form.imageUrls];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="section-title">Listings</h2>
        <p className="section-copy">Upload watch images to R2 and publish listings to the storefront.</p>
      </div>

      <div className="glass-card space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <input
            value={form.name}
            onChange={(event) => {
              const name = event.target.value;
              setForm((current) => ({
                ...current,
                name,
                slug: current.slug || slugify(name)
              }));
            }}
            placeholder="Watch name"
            className="rounded-xl border border-white/15 bg-transparent px-3 py-2 text-sm md:col-span-2"
          />
          <input
            value={form.slug}
            onChange={(event) => setForm({ ...form, slug: slugify(event.target.value) })}
            placeholder="slug-for-url"
            className="rounded-xl border border-white/15 bg-transparent px-3 py-2 text-sm"
          />
          <input
            value={form.brand}
            onChange={(event) => setForm({ ...form, brand: event.target.value })}
            placeholder="Brand"
            className="rounded-xl border border-white/15 bg-transparent px-3 py-2 text-sm"
          />
          <select
            value={form.condition}
            onChange={(event) => setForm({ ...form, condition: event.target.value as ListingRow["condition"] })}
            className="rounded-xl border border-white/15 bg-[#111a30] px-3 py-2 text-sm"
          >
            <option value="New">New</option>
            <option value="Excellent">Excellent</option>
            <option value="Very Good">Very Good</option>
          </select>
          <input
            type="number"
            value={form.year}
            onChange={(event) => setForm({ ...form, year: Number(event.target.value) })}
            placeholder="Year"
            className="rounded-xl border border-white/15 bg-transparent px-3 py-2 text-sm"
          />
          <input
            type="number"
            value={form.priceUsd}
            onChange={(event) => setForm({ ...form, priceUsd: Number(event.target.value) })}
            placeholder="Price USD"
            className="rounded-xl border border-white/15 bg-transparent px-3 py-2 text-sm"
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(event) => setForm({ ...form, published: event.target.checked })}
            />
            Published
          </label>
        </div>

        <textarea
          value={form.description}
          onChange={(event) => setForm({ ...form, description: event.target.value })}
          placeholder="Description"
          rows={4}
          className="w-full rounded-xl border border-white/15 bg-transparent px-3 py-2 text-sm"
        />

        <div className="rounded-xl border border-white/15 p-4">
          <p className="text-sm font-medium">Watch images</p>
          <p className="mt-1 text-xs text-[var(--muted)]">
            First image becomes the main thumbnail. Additional images appear in the listing gallery.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              onChange={(event) => {
                const files = event.target.files;
                if (files?.length) {
                  void uploadFiles(files);
                  event.target.value = "";
                }
              }}
              className="text-sm"
            />
            <span className="text-xs text-[var(--muted)]">{uploading ? "Uploading..." : "Upload one or more to R2"}</span>
          </div>

          {allImages.length > 0 ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              {allImages.map((url, index) => {
                const isMain = url === form.imageUrl;
                return (
                  <div key={`${url}-${index}`} className="rounded-xl border border-white/10 p-2">
                    <div className="relative h-32 w-full overflow-hidden rounded-lg">
                      <RemoteImage
                        src={url}
                        alt={isMain ? "Main thumbnail" : `Additional ${index}`}
                        className="object-cover"
                        sizes="240px"
                      />
                    </div>
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs text-[var(--muted)]">{isMain ? "Main / thumbnail" : "Additional"}</span>
                      <div className="flex gap-2">
                        {!isMain ? (
                          <button type="button" className="text-xs text-[var(--brand-a)]" onClick={() => makeMain(url)}>
                            Make main
                          </button>
                        ) : null}
                        <button type="button" className="text-xs text-red-300" onClick={() => removeImage(url)}>
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={save} disabled={saving || uploading} className="btn-gradient-primary text-sm">
            {saving ? "Saving..." : editingId ? "Update listing" : "Create listing"}
          </button>
          {editingId ? (
            <button type="button" onClick={resetForm} className="btn-gradient-secondary text-sm">
              Cancel edit
            </button>
          ) : null}
        </div>
      </div>

      {error ? <p className="text-sm text-red-300">{error}</p> : null}

      <div className="space-y-3">
        {listings.map((listing) => (
          <div key={listing._id} className="glass-card flex flex-wrap items-center gap-4">
            {listing.imageUrl ? (
              <div className="relative h-16 w-16 overflow-hidden rounded-lg">
                <RemoteImage src={listing.imageUrl} alt={listing.name} className="object-cover" sizes="64px" />
              </div>
            ) : null}
            <div className="min-w-[220px] flex-1">
              <p className="font-medium">{listing.name}</p>
              <p className="text-sm text-[var(--muted)]">
                {listing.brand} • ${listing.priceUsd.toLocaleString()} • {listing.published ? "Published" : "Draft"}
                {(listing.imageUrls?.length ?? 0) > 0 ? ` • ${1 + listing.imageUrls.length} images` : ""}
              </p>
              <p className="text-xs text-[var(--muted)]">/{listing.slug}</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className="btn-gradient-secondary text-sm"
                onClick={() => {
                  setEditingId(listing._id);
                  setForm({
                    slug: listing.slug,
                    name: listing.name,
                    brand: listing.brand,
                    condition: listing.condition,
                    year: listing.year,
                    priceUsd: listing.priceUsd,
                    imageUrl: listing.imageUrl,
                    imageUrls: Array.isArray(listing.imageUrls) ? listing.imageUrls : [],
                    description: listing.description,
                    published: listing.published
                  });
                }}
              >
                Edit
              </button>
              <button type="button" className="text-sm text-red-300" onClick={() => remove(listing._id)}>
                Delete
              </button>
            </div>
          </div>
        ))}
        {listings.length === 0 ? <p className="text-sm text-[var(--muted)]">No listings yet. Create your first watch above.</p> : null}
      </div>
    </div>
  );
}
