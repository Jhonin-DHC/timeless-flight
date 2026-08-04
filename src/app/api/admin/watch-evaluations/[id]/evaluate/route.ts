import { NextResponse } from "next/server";
import { getEbayConfigStatus } from "@/lib/ebay";
import { connectMongo } from "@/lib/mongodb";
import { evaluateWatchAgainstEbay } from "@/lib/watch-evaluation";
import { WatchEvaluation } from "@/models/WatchEvaluation";

interface RouteProps {
  params: Promise<{ id: string }>;
}

export async function POST(_request: Request, { params }: RouteProps) {
  try {
    const { id } = await params;
    const ebay = getEbayConfigStatus();
    if (!ebay.configured) {
      return NextResponse.json(
        { error: "eBay API is not configured. Set EBAY_CLIENT_ID and EBAY_CLIENT_SECRET." },
        { status: 503 }
      );
    }

    await connectMongo();
    const watch = await WatchEvaluation.findById(id);
    if (!watch) {
      return NextResponse.json({ error: "Watch not found." }, { status: 404 });
    }

    const stats = await evaluateWatchAgainstEbay({
      brand: watch.brand,
      model: watch.model,
      referenceNumber: watch.referenceNumber,
      displayName: watch.displayName,
      searchKeywords: watch.searchKeywords,
      marketplaceId: watch.marketplaceId,
      limit: 50
    });

    watch.searchKeywords = stats.searchKeywords;
    watch.lastEvaluatedAt = new Date();
    watch.compsCount = stats.compsCount;
    watch.compsMinUsd = stats.compsMinUsd;
    watch.compsMaxUsd = stats.compsMaxUsd;
    watch.compsAvgUsd = stats.compsAvgUsd;
    watch.compsMedianUsd = stats.compsMedianUsd;
    watch.estimatedLowUsd = stats.estimatedLowUsd;
    watch.estimatedHighUsd = stats.estimatedHighUsd;
    watch.estimatedMidUsd = stats.estimatedMidUsd;
    watch.comps = stats.comps;
    if (watch.status === "draft") watch.status = "evaluating";
    await watch.save();

    return NextResponse.json({
      watch,
      note:
        "Estimates use active eBay listings (asking prices). Last-sold fields can be entered manually until sold-comps API access is available."
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Evaluation failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
