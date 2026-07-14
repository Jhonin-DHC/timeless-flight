import { connectMongo } from "@/lib/mongodb";
import { Listing } from "@/models/Listing";
import { listings as staticListings, type Listing as StaticListing } from "@/data/listings";

export type PublicListing = StaticListing & { published?: boolean };

export async function getPublishedListings(): Promise<PublicListing[]> {
  try {
    await connectMongo();
    const docs = await Listing.find({ published: true }).sort({ createdAt: -1 }).lean();
    if (docs.length === 0) {
      return staticListings;
    }

    return docs.map((doc) => ({
      id: doc._id.toString(),
      storefrontProductId: doc.storefrontProductId || doc.slug,
      slug: doc.slug,
      name: doc.name,
      brand: doc.brand,
      condition: doc.condition as PublicListing["condition"],
      year: doc.year,
      priceUsd: doc.priceUsd,
      imageUrl: doc.imageUrl,
      imageUrls: Array.isArray(doc.imageUrls) ? doc.imageUrls : [],
      description: doc.description,
      published: doc.published
    }));
  } catch {
    return staticListings;
  }
}

export async function getListingBySlug(slug: string): Promise<PublicListing | null> {
  const listings = await getPublishedListings();
  return listings.find((item) => item.slug === slug) ?? null;
}
