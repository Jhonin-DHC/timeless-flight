"use client";

import { useMemo, useState } from "react";
import { Listing } from "@/data/listings";
import { ListingCard } from "@/components/listing-card";

interface ListingsClientProps {
  listings: Listing[];
}

type SortKey = "price-asc" | "price-desc" | "year-desc";

export function ListingsClient({ listings }: ListingsClientProps) {
  const [query, setQuery] = useState("");
  const [brandFilter, setBrandFilter] = useState("all");
  const [sortBy, setSortBy] = useState<SortKey>("price-asc");

  const brands = useMemo(() => ["all", ...new Set(listings.map((item) => item.brand))], [listings]);

  const filtered = useMemo(() => {
    const normalized = query.toLowerCase().trim();

    const results = listings.filter((listing) => {
      const matchesQuery =
        normalized.length === 0 ||
        listing.name.toLowerCase().includes(normalized) ||
        listing.brand.toLowerCase().includes(normalized);
      const matchesBrand = brandFilter === "all" || listing.brand === brandFilter;

      return matchesQuery && matchesBrand;
    });

    const sorted = [...results];
    if (sortBy === "price-asc") sorted.sort((a, b) => a.priceUsd - b.priceUsd);
    if (sortBy === "price-desc") sorted.sort((a, b) => b.priceUsd - a.priceUsd);
    if (sortBy === "year-desc") sorted.sort((a, b) => b.year - a.year);

    return sorted;
  }, [listings, query, brandFilter, sortBy]);

  return (
    <div className="space-y-6">
      <div className="glass-card grid gap-3 md:grid-cols-3">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search model or brand"
          className="rounded-xl border border-white/15 bg-transparent px-3 py-2 text-sm outline-none ring-[var(--brand-a)] focus:ring-2"
          aria-label="Search listings"
        />
        <select
          value={brandFilter}
          onChange={(event) => setBrandFilter(event.target.value)}
          className="rounded-xl border border-white/15 bg-[#111a30] px-3 py-2 text-sm"
          aria-label="Filter by brand"
        >
          {brands.map((brand) => (
            <option key={brand} value={brand}>
              {brand === "all" ? "All brands" : brand}
            </option>
          ))}
        </select>
        <select
          value={sortBy}
          onChange={(event) => setSortBy(event.target.value as SortKey)}
          className="rounded-xl border border-white/15 bg-[#111a30] px-3 py-2 text-sm"
          aria-label="Sort listings"
        >
          <option value="price-asc">Price: Low to high</option>
          <option value="price-desc">Price: High to low</option>
          <option value="year-desc">Year: Newest first</option>
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((listing) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </div>
      {filtered.length === 0 ? <p className="text-sm text-[var(--muted)]">No listings match your filters.</p> : null}
    </div>
  );
}
