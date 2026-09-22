import { NextResponse } from "next/server";
import { parseListingWorkbook, upsertImportedListings } from "@/lib/listing-import";
import { connectMongo } from "@/lib/mongodb";

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Upload a CSV or Excel file." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const rows = parseListingWorkbook(buffer);
    if (rows.length === 0) {
      return NextResponse.json({ error: "No listing rows found in that file." }, { status: 400 });
    }

    await connectMongo();
    const result = await upsertImportedListings(rows);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to import listings.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
