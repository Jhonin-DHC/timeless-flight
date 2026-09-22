"use client";

import { useMemo, useState } from "react";
import { ListingCard } from "@/components/listing-card";
import { listingSection, type ListingCategory, type ShopListing } from "@/lib/listing-types";

interface ListingsClientProps {
  listings: ShopListing[];
  heading?: string;
  intro?: string;
  presetSection?: ListingCategory;
}

type SortKey = "featured" | "price-asc" | "price-desc" | "year-desc" | "name-asc";

function unique(values: Array<string | undefined>) {
  return [...new Set(values.map((value) => value?.trim()).filter((value): value is string => Boolean(value)))].sort();
}

export function ListingsClient({ listings, heading = "Watches", intro, presetSection }: ListingsClientProps) {
  const [query, setQuery] = useState("");
  const [brandFilter, setBrandFilter] = useState("all");
  const [collectionFilter, setCollectionFilter] = useState("all");
  const [availability, setAvailability] = useState<"all" | "in-stock" | "preorder">("all");
  const [sectionFilter, setSectionFilter] = useState<"all" | ListingCategory>(presetSection ?? "all");
  const [maxPrice, setMaxPrice] = useState("all");
  const [sortBy, setSortBy] = useState<SortKey>("featured");

  const brands = useMemo(() => unique(listings.map((item) => item.brand)), [listings]);
  const collections = useMemo(() => unique(listings.map((item) => item.collection)), [listings]);
  const prices = listings.map((item) => item.priceUsd);
  const highest = prices.length ? Math.max(...prices) : 0;

  const filtered = useMemo(() => {
    const normalized = query.toLowerCase().trim();
    const cap = maxPrice === "all" ? Number.POSITIVE_INFINITY : Number(maxPrice);

    const results = listings.filter((listing) => {
      const haystack = [listing.name, listing.brand, listing.referenceNumber, listing.collection, listing.description]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const matchesQuery = normalized.length === 0 || haystack.includes(normalized);
      const matchesBrand = brandFilter === "all" || listing.brand === brandFilter;
      const matchesCollection = collectionFilter === "all" || listing.collection === collectionFilter;
      const section = listingSection(listing);
      const matchesSection = sectionFilter === "all" || section === sectionFilter;
      const matchesAvailability =
        availability === "all" ||
        (availability === "in-stock" && listing.inStock) ||
        (availability === "preorder" && !listing.inStock);
      const matchesPrice =
        maxPrice === "all" ||
        (listing.priceUsd > 0 && !listing.callForPricing && listing.priceUsd <= cap);
      return matchesQuery && matchesBrand && matchesCollection && matchesSection && matchesAvailability && matchesPrice;
    });

    const sorted = [...results];
    const priceAsc = (listing: ShopListing) =>
      listing.callForPricing || listing.priceUsd <= 0 ? Number.POSITIVE_INFINITY : listing.priceUsd;
    const priceDesc = (listing: ShopListing) =>
      listing.callForPricing || listing.priceUsd <= 0 ? -1 : listing.priceUsd;
    if (sortBy === "price-asc") sorted.sort((a, b) => priceAsc(a) - priceAsc(b));
    if (sortBy === "price-desc") sorted.sort((a, b) => priceDesc(b) - priceDesc(a));
    if (sortBy === "year-desc") sorted.sort((a, b) => b.year - a.year);
    if (sortBy === "name-asc") sorted.sort((a, b) => a.name.localeCompare(b.name));
    return sorted;
  }, [listings, query, brandFilter, collectionFilter, availability, sectionFilter, maxPrice, sortBy]);

  const selectClass = "w-full rounded-xl border border-white/15 bg-[#111a30] px-3 py-2 text-sm";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="section-title">{heading}</h1>
          {intro ? <p className="section-copy mt-2 max-w-3xl">{intro}</p> : null}
          <p className="mt-3 text-sm text-[var(--muted)]">
            {filtered.length.toLocaleString()} watch{filtered.length === 1 ? "" : "es"}
          </p>
        </div>
        <select
          value={sortBy}
          onChange={(event) => setSortBy(event.target.value as SortKey)}
          className={`${selectClass} md:w-56`}
          aria-label="Sort watches"
        >
          <option value="featured">Featured</option>
          <option value="price-asc">Price: Low to high</option>
          <option value="price-desc">Price: High to low</option>
          <option value="year-desc">Year: Newest first</option>
          <option value="name-asc">Name: A–Z</option>
        </select>
      </div>

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <aside className="glass-card h-fit space-y-4 lg:sticky lg:top-24">
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--brand-c)]">Filter</p>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search model, brand, ref"
            className="w-full rounded-xl border border-white/15 bg-transparent px-3 py-2 text-sm outline-none ring-[var(--brand-a)] focus:ring-2"
            aria-label="Search watches"
          />
          {presetSection ? null : (
            <label className="block space-y-1 text-sm">
              <span className="text-[var(--muted)]">Category</span>
              <select
                value={sectionFilter}
                onChange={(event) => setSectionFilter(event.target.value as "all" | ListingCategory)}
                className={selectClass}
              >
                <option value="all">All watches</option>
                <option value="shop">Current selection</option>
                <option value="vintage">Vintage (20+ years)</option>
                <option value="project">Project watches</option>
              </select>
            </label>
          )}
          <label className="block space-y-1 text-sm">
            <span className="text-[var(--muted)]">Brand</span>
            <select value={brandFilter} onChange={(event) => setBrandFilter(event.target.value)} className={selectClass}>
              <option value="all">All brands</option>
              {brands.map((brand) => (
                <option key={brand} value={brand}>
                  {brand}
                </option>
              ))}
            </select>
          </label>
          {collections.length > 0 ? (
            <label className="block space-y-1 text-sm">
              <span className="text-[var(--muted)]">Collection</span>
              <select
                value={collectionFilter}
                onChange={(event) => setCollectionFilter(event.target.value)}
                className={selectClass}
              >
                <option value="all">All collections</option>
                {collections.map((collection) => (
                  <option key={collection} value={collection}>
                    {collection}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <label className="block space-y-1 text-sm">
            <span className="text-[var(--muted)]">Availability</span>
            <select
              value={availability}
              onChange={(event) => setAvailability(event.target.value as typeof availability)}
              className={selectClass}
            >
              <option value="all">In stock + pre-order</option>
              <option value="in-stock">In stock only</option>
              <option value="preorder">Pre-order / 3–4 weeks</option>
            </select>
          </label>
          <label className="block space-y-1 text-sm">
            <span className="text-[var(--muted)]">Price</span>
            <select value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} className={selectClass}>
              <option value="all">Any price</option>
              <option value="2500">Under $2,500</option>
              <option value="4000">Under $4,000</option>
              <option value="6000">Under $6,000</option>
              <option value="10000">Under $10,000</option>
              {highest > 10000 ? <option value="20000">Under $20,000</option> : null}
            </select>
          </label>
        </aside>

        <div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {filtered.map((listing) => (
              <ListingCard key={listing.id} listing={listing} compact />
            ))}
          </div>
          {filtered.length === 0 ? (
            <p className="mt-6 text-sm text-[var(--muted)]">No watches match your filters.</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
