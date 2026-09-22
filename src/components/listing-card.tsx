"use client";

import Link from "next/link";
import { useCart } from "@/components/cart-provider";
import { RemoteImage } from "@/components/remote-image";
import { listingSection, formatListingPrice, isCallForPricing, stockLabel, type ShopListing } from "@/lib/listing-types";
import { SITE_PHONE_HREF } from "@/lib/site";

interface ListingCardProps {
  listing: ShopListing;
  compact?: boolean;
}

export function ListingCard({ listing, compact = false }: ListingCardProps) {
  const { addItem } = useCart();
  const section = listingSection(listing);
  const available = listing.inStock !== false;

  return (
    <article className="glass-card overflow-hidden p-0">
      <Link href={`/listings/${listing.slug}`} className="block">
        <div className={`relative w-full overflow-hidden bg-black/30 ${compact ? "h-44" : "h-52"}`}>
          <RemoteImage
            src={listing.imageUrl}
            alt={listing.name}
            className="object-contain object-center"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
          <div className="absolute left-2 top-2 flex flex-col gap-1">
            {!available ? (
              <span className="rounded-full bg-black/75 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-amber-200">
                Not in stock
              </span>
            ) : (
              <span className="rounded-full bg-black/75 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--brand-c)]">
                In stock
              </span>
            )}
            {section === "vintage" ? (
              <span className="rounded-full bg-black/75 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--brand-a)]">
                Vintage
              </span>
            ) : null}
            {section === "project" ? (
              <span className="rounded-full bg-black/75 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-orange-200">
                Project
              </span>
            ) : null}
            {listing.limitedEdition ? (
              <span className="rounded-full bg-black/75 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-amber-100">
                Limited
              </span>
            ) : null}
          </div>
        </div>
      </Link>
      <div className="space-y-2 p-3">
        <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--muted)]">{listing.brand}</p>
        <Link href={`/listings/${listing.slug}`}>
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug">{listing.name}</h3>
        </Link>
        {listing.referenceNumber ? (
          <p className="text-xs text-[var(--muted)]">Ref. {listing.referenceNumber}</p>
        ) : (
          <p className="text-xs text-[var(--muted)]">
            {listing.year} • {listing.condition}
          </p>
        )}
        <p className="text-base font-semibold">{formatListingPrice(listing)}</p>
        {!available ? <p className="text-[11px] leading-snug text-amber-200/90">{stockLabel(listing)}</p> : null}
        <div className="flex flex-wrap gap-2 pt-1">
          <Link href={`/listings/${listing.slug}`} className="btn-gradient-secondary inline-block !px-3 !py-1.5 text-xs">
            View
          </Link>
          {available ? (
            <button
              type="button"
              onClick={() => addItem(listing)}
              className="btn-gradient-primary inline-block !px-3 !py-1.5 text-xs"
            >
              Add to cart
            </button>
          ) : isCallForPricing(listing) ? (
            <a href={SITE_PHONE_HREF} className="btn-gradient-primary inline-block !px-3 !py-1.5 text-xs">
              Call for pricing
            </a>
          ) : (
            <Link href={`/listings/${listing.slug}`} className="btn-gradient-primary inline-block !px-3 !py-1.5 text-xs">
              Pre-order
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
