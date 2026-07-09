import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import { SearchResult } from "@/models/SearchResult";

export async function GET(request: Request) {
  try {
    await connectMongo();
    const { searchParams } = new URL(request.url);
    const queryId = searchParams.get("queryId");
    const onlyNew = searchParams.get("onlyNew") === "true";

    const filter: Record<string, unknown> = {};
    if (queryId) filter.searchQueryId = queryId;
    if (onlyNew) filter.isUnseen = true;

    const results = await SearchResult.find(filter).sort({ lastSeenAt: -1 }).limit(200).lean();
    return NextResponse.json({ results });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load search results.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    await connectMongo();
    const body = (await request.json()) as { ids?: string[]; isUnseen?: boolean };
    if (!body.ids?.length) {
      return NextResponse.json({ error: "ids are required." }, { status: 400 });
    }

    await SearchResult.updateMany({ _id: { $in: body.ids } }, { $set: { isUnseen: body.isUnseen ?? false } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update results.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
