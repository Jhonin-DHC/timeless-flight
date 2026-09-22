import { ListingsClient } from "@/components/listings-client";
import { getPublishedListings } from "@/lib/listings-service";

export const dynamic = "force-dynamic";

export default async function ListingsPage() {
  const listings = await getPublishedListings();

  return (
    <ListingsClient
      listings={listings}
      heading="Watches"
      intro="Browse the catalog by brand, collection, price, and availability — including pre-order pieces estimated at 3–4 weeks."
    />
  );
}
