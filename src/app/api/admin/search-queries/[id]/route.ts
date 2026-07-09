import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import { SearchQuery } from "@/models/SearchQuery";

interface RouteProps {
  params: Promise<{ id: string }>;
}

export async function PUT(request: Request, { params }: RouteProps) {
  try {
    const { id } = await params;
    await connectMongo();
    const body = await request.json();
    const query = await SearchQuery.findByIdAndUpdate(id, body, { new: true });
    if (!query) {
      return NextResponse.json({ error: "Search query not found." }, { status: 404 });
    }
    return NextResponse.json({ query });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update search query.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteProps) {
  try {
    const { id } = await params;
    await connectMongo();
    const query = await SearchQuery.findByIdAndDelete(id);
    if (!query) {
      return NextResponse.json({ error: "Search query not found." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete search query.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
