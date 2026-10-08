import { ListingsClient } from "@/components/listings-client";
import { getPublishedListings } from "@/lib/listings-service";
import { parseListingSearchParams } from "@/lib/listing-types";

export const dynamic = "force-dynamic";

export default async function ProjectWatchesPage({
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
      heading="Project Watches"
      intro="Watches sold as projects — restoration, repair, missing parts, or otherwise needing work. Please read each description carefully."
      presetSection="project"
      initialQuery={query}
      initialBrand={brand}
    />
  );
}
