import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import { buildWatchSearchKeywords } from "@/lib/watch-evaluation";
import { WatchEvaluation } from "@/models/WatchEvaluation";

interface RouteProps {
  params: Promise<{ id: string }>;
}

function pickUpdates(body: Record<string, unknown>) {
  const update: Record<string, unknown> = {};
  const strings = [
    "displayName",
    "brand",
    "model",
    "referenceNumber",
    "serialNumber",
    "movementType",
    "caseMaterial",
    "dialColor",
    "braceletType",
    "condition",
    "knownIssues",
    "notes",
    "source",
    "sellInquiryId",
    "status",
    "searchKeywords",
    "marketplaceId",
    "lastSoldSource",
    "lastSoldUrl"
  ] as const;

  for (const key of strings) {
    if (typeof body[key] === "string") update[key] = (body[key] as string).trim();
  }

  const numbers = [
    "year",
    "caseSizeMm",
    "lastServiceYear",
    "offerPriceUsd",
    "targetSellPriceUsd",
    "costBasisUsd",
    "lastSoldPriceUsd"
  ] as const;
  for (const key of numbers) {
    if (body[key] === "" || body[key] === null) {
      update[key] = undefined;
      continue;
    }
    if (typeof body[key] === "number" || body[key] !== undefined) {
      const value = Number(body[key]);
      if (!Number.isNaN(value)) update[key] = value;
    }
  }

  if (typeof body.boxIncluded === "boolean") update.boxIncluded = body.boxIncluded;
  if (typeof body.papersIncluded === "boolean") update.papersIncluded = body.papersIncluded;
  if (Array.isArray(body.photoUrls)) {
    update.photoUrls = body.photoUrls.filter((url) => typeof url === "string");
  }
  if (body.lastSoldDate) update.lastSoldDate = new Date(String(body.lastSoldDate));
  if (body.lastSoldDate === null || body.lastSoldDate === "") update.lastSoldDate = undefined;

  if (!update.searchKeywords && (update.brand || update.model || update.referenceNumber || update.displayName)) {
    update.searchKeywords = buildWatchSearchKeywords({
      brand: String(update.brand ?? body.brand ?? ""),
      model: String(update.model ?? body.model ?? ""),
      referenceNumber: String(update.referenceNumber ?? body.referenceNumber ?? ""),
      displayName: String(update.displayName ?? body.displayName ?? "")
    });
  }

  return update;
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
    const update = pickUpdates(body);
    if (update.brand === "" || update.displayName === "") {
      return NextResponse.json({ error: "Brand and name are required." }, { status: 400 });
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
