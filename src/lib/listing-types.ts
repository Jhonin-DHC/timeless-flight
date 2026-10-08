export const PLACEHOLDER_IMAGE = "/images/watch-placeholder.svg";

export function isPlaceholderImage(url?: string) {
  if (!url) return true;
  return /watch-placeholder|placeholder-watch/i.test(url);
}
export const OUT_OF_STOCK_NOTE = "Not in Stock — Estimated Delivery 3–4 Weeks";
export const VINTAGE_AGE_YEARS = 20;

export const LISTING_CATEGORIES = ["shop", "vintage", "project"] as const;
export type ListingCategory = (typeof LISTING_CATEGORIES)[number];

export const MAJOR_WATCH_BRANDS = [
  "Rolex",
  "Omega",
  "Tudor",
  "Breitling",
  "TAG Heuer",
  "IWC",
  "Panerai",
  "Cartier",
  "Patek Philippe",
  "Audemars Piguet",
  "Vacheron Constantin",
  "Jaeger-LeCoultre",
  "Zenith",
  "Longines",
  "Hamilton",
  "Sinn",
  "Bell & Ross",
  "Oris",
  "Grand Seiko",
  "Seiko",
  "Citizen",
  "Tissot",
  "Casio",
  "Hublot",
  "Blancpain",
  "Richard Mille",
  "Bulova"
] as const;

export function catalogWatchBrands(inventoryBrands: Array<string | undefined> = []) {
  const extras: string[] = [];
  const majorKeys = new Set(MAJOR_WATCH_BRANDS.map((brand) => brand.toLowerCase()));
  const extraKeys = new Set<string>();

  for (const brand of inventoryBrands) {
    const trimmed = brand?.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (majorKeys.has(key) || extraKeys.has(key)) continue;
    extraKeys.add(key);
    extras.push(trimmed);
  }

  extras.sort((a, b) => a.localeCompare(b));
  return [...MAJOR_WATCH_BRANDS, ...extras];
}

export function canonicalWatchBrand(brand: string) {
  const trimmed = brand.trim();
  if (!trimmed) return trimmed;
  const key = trimmed.toLowerCase();
  return MAJOR_WATCH_BRANDS.find((item) => item.toLowerCase() === key) ?? trimmed;
}

function searchableText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function listingMatchesBrand(
  listing: Pick<ShopListing, "brand" | "name" | "slug">,
  filterBrand: string
) {
  const filter = searchableText(filterBrand);
  if (!filter || filter === "all") return true;
  const brand = searchableText(listing.brand);
  const name = searchableText(listing.name);
  const slug = searchableText(listing.slug || "");
  if (brand === filter) return true;
  if (brand.includes(filter)) return true;
  if (filter.length >= 4 && filter.includes(brand) && brand.length >= 4) return true;
  if (name.includes(filter) || slug.includes(filter)) return true;
  return false;
}

export function listingMatchesQuery(
  listing: Pick<ShopListing, "name" | "brand" | "referenceNumber" | "collection" | "description" | "slug">,
  query: string
) {
  const tokens = searchableText(query).split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return true;
  const haystack = searchableText(
    [listing.name, listing.brand, listing.referenceNumber, listing.collection, listing.description, listing.slug]
      .filter(Boolean)
      .join(" ")
  );
  return tokens.every((token) => haystack.includes(token));
}

export function parseListingSearchParams(searchParams: Record<string, string | string[] | undefined>) {
  const pick = (key: string) => {
    const value = searchParams[key];
    if (typeof value === "string") return value;
    if (Array.isArray(value)) return value[0] ?? "";
    return "";
  };

  return {
    query: pick("q").trim(),
    brand: pick("brand").trim() || "all"
  };
}

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

export function canAddToCart(listing: Pick<ShopListing, "inStock" | "callForPricing" | "priceUsd">) {
  return listing.inStock === true && listing.priceUsd > 0 && !isCallForPricing(listing);
}
