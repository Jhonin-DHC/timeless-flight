import { ListingsClient } from "@/components/listings-client";
import { filterBySection, getPublishedListings } from "@/lib/listings-service";
import { parseListingSearchParams } from "@/lib/listing-types";

export const dynamic = "force-dynamic";

export default async function VintageWatchesPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const listings = filterBySection(await getPublishedListings(), "vintage");
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
