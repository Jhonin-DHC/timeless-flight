import { connectMongo } from "@/lib/mongodb";
import { normalizePublicImageUrl, normalizePublicImageUrls } from "@/lib/r2";
import {
  canonicalWatchBrand,
  listingMatchesBrand,
  listingSection,
  PLACEHOLDER_IMAGE,
  type ListingCategory,
  type ListingCondition,
  type ShopListing
} from "@/lib/listing-types";
import { Listing } from "@/models/Listing";
import { listings as staticListings } from "@/data/listings";

export type PublicListing = ShopListing;

function asPublicListing(input: {
  id: string;
  storefrontProductId?: string;
  slug: string;
  name: string;
  brand: string;
  referenceNumber?: string;
  collection?: string;
  condition: string;
  year: number;
  priceUsd: number;
  imageUrl: string;
  imageUrls?: string[];
  description: string;
  published?: boolean;
  category?: string;
  inStock?: boolean;
  availabilityNote?: string;
  limitedEdition?: boolean;
  callForPricing?: boolean;
  productionQuantity?: string;
}): PublicListing {
  const category = (input.category as ListingCategory) || "shop";
  return {
    id: input.id,
    storefrontProductId: input.storefrontProductId || input.slug,
    slug: input.slug,
    name: input.name,
    brand: canonicalWatchBrand(input.brand || ""),
    referenceNumber: input.referenceNumber || "",
    collection: input.collection || "",
    condition: input.condition as ListingCondition,
    year: input.year,
    priceUsd: input.priceUsd,
    imageUrl: normalizePublicImageUrl(input.imageUrl || PLACEHOLDER_IMAGE),
    imageUrls: normalizePublicImageUrls(Array.isArray(input.imageUrls) ? input.imageUrls : []),
    description: input.description,
    published: input.published,
    category,
    inStock: input.inStock !== false,
    availabilityNote: input.availabilityNote || "",
    limitedEdition: Boolean(input.limitedEdition),
    callForPricing: Boolean(input.callForPricing) || Number(input.priceUsd) <= 0,
    productionQuantity: input.productionQuantity || ""
  };
}

function fromDoc(doc: {
  _id: { toString(): string };
  storefrontProductId?: string;
  slug: string;
  name: string;
  brand: string;
  referenceNumber?: string;
  collection?: string;
  condition: string;
  year: number;
  priceUsd: number;
  imageUrl: string;
  imageUrls?: string[];
  description: string;
  published?: boolean;
  category?: string;
  inStock?: boolean;
  availabilityNote?: string;
  limitedEdition?: boolean;
  callForPricing?: boolean;
  productionQuantity?: string;
}): PublicListing {
  return asPublicListing({
    id: doc._id.toString(),
    storefrontProductId: doc.storefrontProductId || doc.slug,
    slug: doc.slug,
    name: doc.name,
    brand: doc.brand,
    referenceNumber: doc.referenceNumber,
    collection: doc.collection,
    condition: doc.condition,
    year: doc.year,
    priceUsd: doc.priceUsd,
    imageUrl: doc.imageUrl,
    imageUrls: Array.isArray(doc.imageUrls) ? doc.imageUrls : [],
    description: doc.description,
    published: doc.published,
    category: doc.category,
    inStock: doc.inStock,
    availabilityNote: doc.availabilityNote,
    limitedEdition: doc.limitedEdition,
    callForPricing: doc.callForPricing,
    productionQuantity: doc.productionQuantity
  });
}

function fromStatic(): PublicListing[] {
  return staticListings.map((listing) =>
    asPublicListing({
      ...listing,
      category: listing.category,
      inStock: listing.inStock,
      availabilityNote: listing.availabilityNote
    })
  );
}

export async function getPublishedListings(): Promise<PublicListing[]> {
  try {
    await connectMongo();
    const docs = await Listing.find({ published: true }).sort({ createdAt: -1 }).lean();
    if (docs.length === 0) {
      return fromStatic();
    }

    return docs.map((doc) => fromDoc(doc));
  } catch {
    return fromStatic();
  }
}

export async function getListingBySlug(slug: string): Promise<PublicListing | null> {
  try {
    await connectMongo();
    const doc = await Listing.findOne({ slug, published: true }).lean();
    if (doc) return fromDoc(doc);
    const publishedCount = await Listing.countDocuments({ published: true });
    if (publishedCount > 0) return null;
  } catch {
    // Fall through to static listings when Mongo is unavailable.
  }

  return fromStatic().find((item) => item.slug === slug) ?? null;
}

export async function getRelatedListings(listing: PublicListing, limit = 4): Promise<PublicListing[]> {
  const listings = await getPublishedListings();
  return listings
    .filter((item) => item.slug !== listing.slug)
    .map((item) => {
      let score = 0;
      if (listingMatchesBrand(item, listing.brand)) score += 5;
      if (listing.collection && item.collection && item.collection === listing.collection) score += 3;
      if (listing.limitedEdition && item.limitedEdition) score += 2;
      if (listingSection(item) === listingSection(listing)) score += 1;
      return { item, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.item);
}

function searchable(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function listingsRelatedToBlog(
  listings: PublicListing[],
  post: { title: string; summary?: string; body?: string }
): PublicListing[] {
  const haystack = searchable([post.title, post.summary || "", post.body || ""].join(" "));
  if (!haystack) return [];

  return listings
    .map((listing) => {
      let score = 0;
      const ref = searchable(listing.referenceNumber || "");
      if (ref.length >= 4 && haystack.includes(ref)) score += 10;
      const name = searchable(listing.name);
      if (name.length >= 10 && haystack.includes(name)) score += 8;
      const slugTokens = listing.slug.split("-").filter((token) => token.length > 3);
      const matchedTokens = slugTokens.filter((token) => haystack.includes(token));
      if (matchedTokens.length >= 2) score += matchedTokens.length;
      return { listing, score };
    })
    .filter((entry) => entry.score >= 5)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((entry) => entry.listing);
}

export function filterBySection(listings: PublicListing[], section?: ListingCategory) {
  if (!section) return listings;
  return listings.filter((listing) => listingSection(listing) === section);
}

export function filterLimitedEditions(listings: PublicListing[]) {
  return listings.filter((listing) => listing.limitedEdition);
}
