import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/json-ld";
import { ListingCard } from "@/components/listing-card";
import { ListingDescription } from "@/components/listing-description";
import { ListingImageGallery } from "@/components/listing-image-gallery";
import { ListingModalTrigger } from "@/components/listing-modal-trigger";
import {
  listingBreadcrumbJsonLd,
  listingBreadcrumbs,
  listingMetadata,
  listingProductJsonLd,
  listingSpecRows
} from "@/lib/listing-seo";
import { listingSection, formatListingPrice, isCallForPricing, stockLabel } from "@/lib/listing-types";
import { getListingBySlug, getRelatedListings } from "@/lib/listings-service";
import { SITE_PHONE_DISPLAY, SITE_PHONE_HREF } from "@/lib/site";
import { notFound } from "next/navigation";

interface ListingDetailProps {
  params: Promise<{ slug: string }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: ListingDetailProps): Promise<Metadata> {
  const { slug } = await params;
  const listing = await getListingBySlug(slug);
  if (!listing) return { title: "Watch" };
  return listingMetadata(listing);
}

export default async function ListingDetailPage({ params }: ListingDetailProps) {
  const { slug } = await params;
  const listing = await getListingBySlug(slug);

  if (!listing) {
    notFound();
  }

  const section = listingSection(listing);
  const inStock = listing.inStock === true;
  const related = await getRelatedListings(listing);
  const crumbs = listingBreadcrumbs(listing);
  const specs = listingSpecRows(listing);

  return (
    <article className="space-y-6">
      <JsonLd data={listingProductJsonLd(listing)} />
      <JsonLd data={listingBreadcrumbJsonLd(listing)} />

      <nav aria-label="Breadcrumb" className="text-sm text-[var(--muted)]">
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {crumbs.map((crumb, index) => {
            const last = index === crumbs.length - 1;
            return (
              <li key={`${crumb.href}-${index}`} className="flex items-center gap-2">
                {index > 0 ? <span aria-hidden="true">/</span> : null}
                {last ? (
                  <span className="text-[var(--foreground)]">{crumb.label}</span>
                ) : (
                  <Link href={crumb.href} className="text-[var(--brand-a)]">
                    {crumb.label}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      <div className="glass-panel space-y-6">
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
          <dl className="grid gap-2 sm:grid-cols-2">
            {specs.map((row) => (
              <div key={row.label} className="glass-card !py-3">
                <dt className="text-xs uppercase tracking-wide text-[var(--muted)]">{row.label}</dt>
                <dd className="mt-1 text-sm font-medium">{row.value}</dd>
              </div>
            ))}
          </dl>
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
      </div>

      {related.length > 0 ? (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Similar watches</h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {related.map((item) => (
              <ListingCard key={item.id} listing={item} compact />
            ))}
          </div>
        </section>
      ) : null}
    </article>
  );
}
