"use client";

import { useEffect, useState } from "react";

interface ListingRow {
  _id: string;
  storefrontProductId: string;
  slug: string;
  name: string;
  brand: string;
  condition: "New" | "Excellent" | "Very Good";
  year: number;
  priceUsd: number;
  imageUrl: string;
  description: string;
  published: boolean;
}

const emptyForm: Omit<ListingRow, "_id"> = {
  storefrontProductId: "",
  slug: "",
  name: "",
  brand: "",
  condition: "Excellent",
  year: new Date().getFullYear(),
  priceUsd: 0,
  imageUrl: "",
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
    setListings(payload.listings ?? []);
  };

  useEffect(() => {
    void load();
  }, []);

  const uploadImage = async (file: File) => {
    setUploading(true);
    setError(null);

    const body = new FormData();
    body.append("file", file);

    const response = await fetch("/api/admin/uploads", {
      method: "POST",
      body
    });
    const payload = await response.json();
    setUploading(false);

    if (!response.ok) {
      setError(payload.error ?? "Image upload failed.");
      return;
    }

    setForm((current) => ({ ...current, imageUrl: payload.url }));
  };

  const save = async () => {
    setSaving(true);
    setError(null);

    if (!form.name || !form.slug || !form.brand || !form.storefrontProductId || !form.imageUrl) {
      setError("Name, slug, brand, storefront product ID, and image are required.");
      setSaving(false);
      return;
    }

    const response = await fetch(editingId ? `/api/admin/listings/${editingId}` : "/api/admin/listings", {
      method: editingId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
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
          <input
            value={form.storefrontProductId}
            onChange={(event) => setForm({ ...form, storefrontProductId: event.target.value })}
            placeholder="GHL storefront product ID"
            className="rounded-xl border border-white/15 bg-transparent px-3 py-2 text-sm md:col-span-2"
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
          <p className="text-sm font-medium">Watch image</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void uploadImage(file);
              }}
              className="text-sm"
            />
            <span className="text-xs text-[var(--muted)]">{uploading ? "Uploading..." : "Upload to R2"}</span>
          </div>
          {form.imageUrl ? (
            <div className="mt-4 space-y-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={form.imageUrl} alt="Listing preview" className="h-40 w-40 rounded-xl object-cover" />
              <input
                value={form.imageUrl}
                onChange={(event) => setForm({ ...form, imageUrl: event.target.value })}
                placeholder="Image URL"
                className="w-full rounded-xl border border-white/15 bg-transparent px-3 py-2 text-sm"
              />
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
              // eslint-disable-next-line @next/next/no-img-element
              <img src={listing.imageUrl} alt={listing.name} className="h-16 w-16 rounded-lg object-cover" />
            ) : null}
            <div className="min-w-[220px] flex-1">
              <p className="font-medium">{listing.name}</p>
              <p className="text-sm text-[var(--muted)]">
                {listing.brand} • ${listing.priceUsd.toLocaleString()} • {listing.published ? "Published" : "Draft"}
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
                    storefrontProductId: listing.storefrontProductId,
                    slug: listing.slug,
                    name: listing.name,
                    brand: listing.brand,
                    condition: listing.condition,
                    year: listing.year,
                    priceUsd: listing.priceUsd,
                    imageUrl: listing.imageUrl,
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
