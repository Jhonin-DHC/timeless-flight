import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import { Listing } from "@/models/Listing";

interface RouteProps {
  params: Promise<{ id: string }>;
}

export async function PUT(request: Request, { params }: RouteProps) {
  try {
    const { id } = await params;
    await connectMongo();
    const body = await request.json();
    const listing = await Listing.findByIdAndUpdate(id, body, { new: true });
    if (!listing) {
      return NextResponse.json({ error: "Listing not found." }, { status: 404 });
    }
    return NextResponse.json({ listing });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update listing.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteProps) {
  try {
    const { id } = await params;
    await connectMongo();
    const listing = await Listing.findByIdAndDelete(id);
    if (!listing) {
      return NextResponse.json({ error: "Listing not found." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete listing.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
