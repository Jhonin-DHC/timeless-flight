import { NextResponse } from "next/server";
import { catalogRowsFromSeed, upsertImportedListings } from "@/lib/listing-import";
import { connectMongo } from "@/lib/mongodb";

export async function POST() {
  try {
    await connectMongo();
    const result = await upsertImportedListings(catalogRowsFromSeed());
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to import catalog.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
