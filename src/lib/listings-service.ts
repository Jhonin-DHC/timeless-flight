import { connectMongo } from "@/lib/mongodb";
import { normalizePublicImageUrl, normalizePublicImageUrls } from "@/lib/r2";
import {
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
    brand: input.brand,
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

    return docs.map((doc) =>
      asPublicListing({
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
      })
    );
  } catch {
    return fromStatic();
  }
}

export async function getListingBySlug(slug: string): Promise<PublicListing | null> {
  const listings = await getPublishedListings();
  return listings.find((item) => item.slug === slug) ?? null;
}

export function filterBySection(listings: PublicListing[], section?: ListingCategory) {
  if (!section) return listings;
  return listings.filter((listing) => listingSection(listing) === section);
}

export function filterLimitedEditions(listings: PublicListing[]) {
  return listings.filter((listing) => listing.limitedEdition);
}
