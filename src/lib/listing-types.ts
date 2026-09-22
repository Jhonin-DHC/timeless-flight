export const PLACEHOLDER_IMAGE = "/images/watch-placeholder.svg";
export const OUT_OF_STOCK_NOTE = "Not in Stock — Estimated Delivery 3–4 Weeks";
export const VINTAGE_AGE_YEARS = 20;

export const LISTING_CATEGORIES = ["shop", "vintage", "project"] as const;
export type ListingCategory = (typeof LISTING_CATEGORIES)[number];

export const LISTING_CONDITIONS = ["New", "Excellent", "Very Good", "Good", "Fair"] as const;
export type ListingCondition = (typeof LISTING_CONDITIONS)[number];

export interface ShopListing {
  id: string;
  storefrontProductId?: string;
  slug: string;
  name: string;
  brand: string;
  referenceNumber?: string;
  collection?: string;
  condition: ListingCondition;
  year: number;
  priceUsd: number;
  imageUrl: string;
  imageUrls?: string[];
  description: string;
  published?: boolean;
  category: ListingCategory;
  inStock: boolean;
  availabilityNote?: string;
  limitedEdition?: boolean;
  callForPricing?: boolean;
  productionQuantity?: string;
}

export function isVintageYear(year: number, now = new Date().getFullYear()) {
  return Boolean(year) && year <= now - VINTAGE_AGE_YEARS;
}

export function listingSection(listing: Pick<ShopListing, "category" | "year">): ListingCategory {
  if (listing.category === "project") return "project";
  if (listing.category === "vintage" || isVintageYear(listing.year)) return "vintage";
  return "shop";
}

export function stockLabel(listing: Pick<ShopListing, "inStock" | "availabilityNote">) {
  if (listing.inStock) return "In stock";
  return listing.availabilityNote?.trim() || OUT_OF_STOCK_NOTE;
}

export function isCallForPricing(listing: Pick<ShopListing, "callForPricing" | "priceUsd">) {
  return Boolean(listing.callForPricing) || listing.priceUsd <= 0;
}

export function formatListingPrice(listing: Pick<ShopListing, "callForPricing" | "priceUsd">) {
  if (isCallForPricing(listing)) return "Call for Pricing";
  return `$${listing.priceUsd.toLocaleString()}`;
}
