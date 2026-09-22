import { ListingsClient } from "@/components/listings-client";
import { filterLimitedEditions, getPublishedListings } from "@/lib/listings-service";

export const dynamic = "force-dynamic";

export default async function LimitedEditionsPage() {
  const listings = filterLimitedEditions(await getPublishedListings());

  return (
    <ListingsClient
      listings={listings}
      heading="Limited Editions"
      intro="Numbered and scarce Breitling limited editions — Navitimer, Chronomat, and collector pieces. Ultra-rare 25-piece watches are listed as Out of Stock, Call for Pricing."
    />
  );
}
