import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import { buildWatchSearchKeywords } from "@/lib/watch-evaluation";
import { normalizeWatchEvaluationBody } from "@/lib/watch-evaluation-fields";
import { WatchEvaluation } from "@/models/WatchEvaluation";

interface RouteProps {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteProps) {
  try {
    const { id } = await params;
    await connectMongo();
    const watch = await WatchEvaluation.findById(id).lean();
    if (!watch) return NextResponse.json({ error: "Watch not found." }, { status: 404 });
    return NextResponse.json({ watch });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load watch.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: RouteProps) {
  try {
    const { id } = await params;
    await connectMongo();
    const body = await request.json();
    const update = normalizeWatchEvaluationBody(body);
    if (!update.brand || !update.displayName) {
      return NextResponse.json({ error: "Brand and name are required." }, { status: 400 });
    }
    if (!update.searchKeywords) {
      update.searchKeywords = buildWatchSearchKeywords(update);
    }
    const watch = await WatchEvaluation.findByIdAndUpdate(id, update, { new: true });
    if (!watch) return NextResponse.json({ error: "Watch not found." }, { status: 404 });
    return NextResponse.json({ watch });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update watch.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteProps) {
  try {
    const { id } = await params;
    await connectMongo();
    const watch = await WatchEvaluation.findByIdAndDelete(id);
    if (!watch) return NextResponse.json({ error: "Watch not found." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete watch.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
