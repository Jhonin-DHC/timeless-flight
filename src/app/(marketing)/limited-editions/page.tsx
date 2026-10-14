import type { Metadata } from "next";
import { ListingsClient } from "@/components/listings-client";
import { staticPageMetadata } from "@/lib/listing-seo";
import { getPublishedListings } from "@/lib/listings-service";
import { parseListingSearchParams } from "@/lib/listing-types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = staticPageMetadata({
  title: "Breitling limited editions",
  description:
    "Numbered Breitling limited editions — Navitimer, Chronomat, Super 8, and scarce collector pieces listed by reference.",
  path: "/limited-editions"
});

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
