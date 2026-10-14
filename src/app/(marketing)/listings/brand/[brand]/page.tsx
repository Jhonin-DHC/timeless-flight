import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { ListingsClient } from "@/components/listings-client";
import { brandFromSegment, brandHubPath, brandHubSegment, staticPageMetadata } from "@/lib/listing-seo";
import { listingMatchesBrand, parseListingSearchParams } from "@/lib/listing-types";
import { getPublishedListings } from "@/lib/listings-service";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ brand: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { brand: segment } = await params;
  const listings = await getPublishedListings();
  const brand = brandFromSegment(segment, listings);
  if (!brand) return { title: "Watches" };
  return staticPageMetadata({
    title: `${brand} watches`,
    description: `Shop ${brand} watches — current pieces, vintage, limited editions, and project watches, listed by model and reference.`,
    path: brandHubPath(brand)
  });
}

export default async function BrandHubPage({ params, searchParams }: PageProps) {
  const { brand: segment } = await params;
  const listings = await getPublishedListings();
  const brand = brandFromSegment(segment, listings);
  if (!brand) notFound();
  if (brandHubSegment(brand) !== segment) permanentRedirect(brandHubPath(brand));

  const matches = listings.filter((listing) => listingMatchesBrand(listing, brand));
  if (matches.length === 0) notFound();

  const { query } = parseListingSearchParams(await searchParams);

  return (
    <ListingsClient
      key={`${brand}-${query}`}
      listings={matches}
      heading={`${brand} watches`}
      intro={`Shop ${brand} by model and reference — including current pieces, vintage, limited editions, and project watches.`}
      initialQuery={query}
      initialBrand={brand}
    />
  );
}
