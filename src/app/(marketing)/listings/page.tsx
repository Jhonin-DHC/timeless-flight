import { ListingsClient } from "@/components/listings-client";
import { getPublishedListings } from "@/lib/listings-service";

export const dynamic = "force-dynamic";

export default async function ListingsPage() {
  const listings = await getPublishedListings();

  return (
    <section className="space-y-6">
      <h1 className="section-title">Listings</h1>
      <p className="section-copy max-w-3xl">
        Filter by brand and condition, sort by price, and search by model to quickly find the right watch.
      </p>
      <ListingsClient listings={listings} />
    </section>
  );
}
