import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import { SearchQuery } from "@/models/SearchQuery";

export async function GET() {
  try {
    await connectMongo();
    const queries = await SearchQuery.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json({ queries });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load search queries.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectMongo();
    const body = await request.json();
    const query = await SearchQuery.create(body);
    return NextResponse.json({ query }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create search query.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
