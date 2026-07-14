import { notFound } from "next/navigation";
import { ListingImageGallery } from "@/components/listing-image-gallery";
import { ListingModalTrigger } from "@/components/listing-modal-trigger";
import { getListingBySlug } from "@/lib/listings-service";

interface ListingDetailProps {
  params: Promise<{ slug: string }>;
}

export const dynamic = "force-dynamic";

export default async function ListingDetailPage({ params }: ListingDetailProps) {
  const { slug } = await params;
  const listing = await getListingBySlug(slug);

  if (!listing) {
    notFound();
  }

  return (
    <article className="glass-panel space-y-6">
      <ListingImageGallery name={listing.name} imageUrl={listing.imageUrl} imageUrls={listing.imageUrls} />
      <div className="space-y-4">
        <h1 className="section-title">{listing.name}</h1>
        <p className="section-copy">{listing.description}</p>
        <div className="flex flex-wrap gap-2 text-sm text-[var(--muted)]">
          <span className="glass-card !py-2">{listing.brand}</span>
          <span className="glass-card !py-2">{listing.condition}</span>
          <span className="glass-card !py-2">{listing.year}</span>
        </div>
      </div>
      <ListingModalTrigger listingName={listing.name} />
    </article>
  );
}
