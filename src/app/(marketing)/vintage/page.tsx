import { ListingsClient } from "@/components/listings-client";
import { filterBySection, getPublishedListings } from "@/lib/listings-service";

export const dynamic = "force-dynamic";

export default async function VintageWatchesPage() {
  const listings = filterBySection(await getPublishedListings(), "vintage");

  return (
    <ListingsClient
      listings={listings}
      heading="Vintage Watches"
      intro="Timepieces more than 20 years old — character, provenance, and period-correct design."
      presetSection="vintage"
    />
  );
}
