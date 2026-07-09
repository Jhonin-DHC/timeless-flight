import { notFound } from "next/navigation";
import { ListingModalTrigger } from "@/components/listing-modal-trigger";
import { getListingBySlug } from "@/lib/listings-service";
import Image from "next/image";

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
      <div className="relative h-[300px] w-full overflow-hidden rounded-2xl md:h-[420px]">
        <Image src={listing.imageUrl} alt={listing.name} fill className="object-cover" sizes="(max-width: 768px) 100vw, 80vw" priority />
      </div>
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
