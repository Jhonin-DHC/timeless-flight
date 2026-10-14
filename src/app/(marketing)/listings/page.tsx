import type { Metadata } from "next";
import { ListingsClient } from "@/components/listings-client";
import { staticPageMetadata } from "@/lib/listing-seo";
import { getPublishedListings } from "@/lib/listings-service";
import { parseListingSearchParams } from "@/lib/listing-types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = staticPageMetadata({
  title: "Watches for sale",
  description:
    "Browse branded watches by brand, model, and reference — including vintage, limited editions, and project pieces.",
  path: "/listings"
});

export default async function ListingsPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const listings = await getPublishedListings();
  const { query, brand } = parseListingSearchParams(await searchParams);

  return (
    <ListingsClient
      key={`${query}-${brand}`}
      listings={listings}
      heading="Watches"
      intro="Browse the catalog by brand, collection, price, and availability — including pre-order pieces estimated at 3–4 weeks."
      initialQuery={query}
      initialBrand={brand}
    />
  );
}
