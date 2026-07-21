import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import { normalizePublicImageUrl, normalizePublicImageUrls } from "@/lib/r2";
import { Listing } from "@/models/Listing";

export async function GET() {
  try {
    await connectMongo();
    const listings = await Listing.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json({
      listings: listings.map((listing) => ({
        ...listing,
        imageUrl: normalizePublicImageUrl(listing.imageUrl),
        imageUrls: normalizePublicImageUrls(Array.isArray(listing.imageUrls) ? listing.imageUrls : [])
      }))
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load listings.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectMongo();
    const body = await request.json();
    const listing = await Listing.create(body);
    return NextResponse.json({ listing }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create listing.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
