import { ListingsClient } from "@/components/listings-client";
import { getPublishedListings } from "@/lib/listings-service";
import { parseListingSearchParams } from "@/lib/listing-types";

export const dynamic = "force-dynamic";

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
