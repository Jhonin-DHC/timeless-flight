"use client";

import Link from "next/link";
import { useCart } from "@/components/cart-provider";
import { RemoteImage } from "@/components/remote-image";
import { Listing } from "@/data/listings";

interface ListingCardProps {
  listing: Listing;
}

export function ListingCard({ listing }: ListingCardProps) {
  const { addItem } = useCart();

  return (
    <article className="glass-card overflow-hidden p-0">
      <div className="relative h-48 w-full">
        <RemoteImage
          src={listing.imageUrl}
          alt={listing.name}
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
      </div>
      <div className="space-y-3 p-4">
        <h3 className="text-lg font-semibold">{listing.name}</h3>
        <p className="text-sm text-[var(--muted)]">{listing.brand} • {listing.year} • {listing.condition}</p>
        <p className="text-base font-medium">${listing.priceUsd.toLocaleString()}</p>
        <Link href={`/listings/${listing.slug}`} className="btn-gradient-secondary inline-block text-sm">
          View details
        </Link>
        <button type="button" onClick={() => addItem(listing)} className="btn-gradient-primary inline-block text-sm">
          Add to cart
        </button>
      </div>
    </article>
  );
}
