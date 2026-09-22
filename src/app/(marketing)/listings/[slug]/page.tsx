import Link from "next/link";
import { ListingDescription } from "@/components/listing-description";
import { ListingImageGallery } from "@/components/listing-image-gallery";
import { ListingModalTrigger } from "@/components/listing-modal-trigger";
import { listingSection, formatListingPrice, isCallForPricing, stockLabel } from "@/lib/listing-types";
import { getListingBySlug } from "@/lib/listings-service";
import { SITE_PHONE_DISPLAY, SITE_PHONE_HREF } from "@/lib/site";
import { notFound } from "next/navigation";

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

  const section = listingSection(listing);
  const inStock = listing.inStock === true;

  return (
    <article className="glass-panel space-y-6">
      <ListingImageGallery name={listing.name} imageUrl={listing.imageUrl} imageUrls={listing.imageUrls} />
      <div className="space-y-4">
        <p className="text-sm uppercase tracking-[0.18em] text-[var(--brand-c)]">{listing.brand}</p>
        <h1 className="section-title">{listing.name}</h1>
        <p className="text-2xl font-semibold">{formatListingPrice(listing)}</p>
        <p className={`text-sm font-medium ${inStock ? "text-[var(--brand-c)]" : "text-amber-200"}`}>
          {stockLabel(listing)}
        </p>
        {isCallForPricing(listing) ? (
          <p className="text-sm text-[var(--muted)]">
            Call{" "}
            <a href={SITE_PHONE_HREF} className="font-semibold text-[var(--brand-a)]">
              {SITE_PHONE_DISPLAY}
            </a>{" "}
            for availability and pricing.
          </p>
        ) : null}
        <ListingDescription text={listing.description} />
        <div className="flex flex-wrap gap-2 text-sm text-[var(--muted)]">
          <span className="glass-card !py-2">{listing.brand}</span>
          {listing.collection ? <span className="glass-card !py-2">{listing.collection}</span> : null}
          {listing.referenceNumber ? <span className="glass-card !py-2">Ref. {listing.referenceNumber}</span> : null}
          {listing.limitedEdition ? <span className="glass-card !py-2">Limited edition</span> : null}
          {listing.productionQuantity ? (
            <span className="glass-card !py-2">{listing.productionQuantity} pieces</span>
          ) : null}
          <span className="glass-card !py-2">{listing.condition}</span>
          <span className="glass-card !py-2">{listing.year}</span>
          {section === "vintage" ? <span className="glass-card !py-2">Vintage</span> : null}
          {section === "project" ? <span className="glass-card !py-2">Project watch</span> : null}
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        {section === "vintage" ? (
          <Link href="/vintage" className="btn-gradient-secondary w-fit">
            All vintage watches
          </Link>
        ) : null}
        {section === "project" ? (
          <Link href="/project-watches" className="btn-gradient-secondary w-fit">
            All project watches
          </Link>
        ) : null}
        {listing.limitedEdition ? (
          <Link href="/limited-editions" className="btn-gradient-secondary w-fit">
            All limited editions
          </Link>
        ) : null}
        <Link href="/listings" className="btn-gradient-secondary w-fit">
          All watches
        </Link>
        <ListingModalTrigger listingName={listing.name} />
      </div>
    </article>
  );
}
