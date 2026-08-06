import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import { buildWatchSearchKeywords } from "@/lib/watch-evaluation";
import { normalizeWatchEvaluationBody } from "@/lib/watch-evaluation-fields";
import { WatchEvaluation } from "@/models/WatchEvaluation";

export async function GET() {
  try {
    await connectMongo();
    const watches = await WatchEvaluation.find().sort({ updatedAt: -1 }).lean();
    return NextResponse.json({ watches });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load watches.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectMongo();
    const body = await request.json();
    const data = normalizeWatchEvaluationBody(body);
    if (!data.brand || !data.displayName) {
      return NextResponse.json({ error: "Brand and name are required." }, { status: 400 });
    }
    if (!data.searchKeywords) {
      data.searchKeywords = buildWatchSearchKeywords(data);
    }
    const watch = await WatchEvaluation.create(data);
    return NextResponse.json({ watch }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create watch.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
