import { ListingsClient } from "@/components/listings-client";
import { getPublishedListings } from "@/lib/listings-service";
import { parseListingSearchParams } from "@/lib/listing-types";

export const dynamic = "force-dynamic";

export default async function LimitedEditionsPage({
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
      heading="Limited Editions"
      intro="Numbered and scarce Breitling limited editions — Navitimer, Chronomat, and collector pieces. Ultra-rare 25-piece watches are listed as Out of Stock, Call for Pricing."
      presetLimited
      initialQuery={query}
      initialBrand={brand}
    />
  );
}
