import type { Metadata } from "next";
import { ListingsClient } from "@/components/listings-client";
import { staticPageMetadata } from "@/lib/listing-seo";
import { getPublishedListings } from "@/lib/listings-service";
import { parseListingSearchParams } from "@/lib/listing-types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = staticPageMetadata({
  title: "Vintage watches",
  description:
    "Vintage watches more than 20 years old — Omega, Seiko, Tudor, Breitling, and other branded pieces listed by reference.",
  path: "/vintage"
});

export default async function VintageWatchesPage({
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
      heading="Vintage Watches"
      intro="Timepieces more than 20 years old — character, provenance, and period-correct design."
      presetSection="vintage"
      initialQuery={query}
      initialBrand={brand}
    />
  );
}
