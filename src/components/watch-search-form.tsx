"use client";

import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { catalogWatchBrands } from "@/lib/listing-types";

interface WatchSearchFormProps {
  extraBrands?: Array<string | undefined>;
  initialQuery?: string;
  initialBrand?: string;
  action?: "/listings" | "/vintage" | "/limited-editions" | "/project-watches";
}

export function WatchSearchForm({
  extraBrands = [],
  initialQuery = "",
  initialBrand = "all",
  action = "/listings"
}: WatchSearchFormProps) {
  const router = useRouter();
  const brands = catalogWatchBrands(extraBrands);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const query = String(data.get("q") || "").trim();
    const brand = String(data.get("brand") || "all");
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (brand && brand !== "all") params.set("brand", brand);
    const queryString = params.toString();
    router.push(queryString ? `${action}?${queryString}` : action);
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-stretch" role="search">
      <label className="sm:w-48">
        <span className="sr-only">Brand</span>
        <select
          name="brand"
          defaultValue={initialBrand || "all"}
          className="h-12 w-full rounded-xl border border-white/15 bg-[#111a30] px-3 text-sm"
        >
          <option value="all">All brands</option>
          {brands.map((brand) => (
            <option key={brand} value={brand}>
              {brand}
            </option>
          ))}
        </select>
      </label>
      <label className="min-w-0 flex-1">
        <span className="sr-only">Search watches</span>
        <input
          name="q"
          defaultValue={initialQuery}
          placeholder="Search model, brand, or reference"
          className="h-12 w-full rounded-xl border border-white/15 bg-transparent px-4 text-sm outline-none ring-[var(--brand-a)] focus:ring-2"
        />
      </label>
      <button type="submit" className="btn-gradient-primary h-12 px-6">
        Search
      </button>
    </form>
  );
}
