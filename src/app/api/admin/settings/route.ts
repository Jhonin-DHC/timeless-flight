import { NextResponse } from "next/server";
import { getEbayConfigStatus } from "@/lib/ebay";
import { connectMongo } from "@/lib/mongodb";
import { isR2Configured } from "@/lib/r2";
import { getSetting, setSetting } from "@/models/AppSettings";

export async function GET() {
  try {
    await connectMongo();
    const marketplaceId = await getSetting("marketplaceId", process.env.EBAY_MARKETPLACE_ID ?? "EBAY_US");
    const searchRunsPerDay = await getSetting("searchRunsPerDay", 3);
    const ebay = getEbayConfigStatus();
    return NextResponse.json({
      settings: {
        marketplaceId,
        searchRunsPerDay,
        ebayConfigured: ebay.configured,
        ebayEnv: ebay.env,
        mongoConfigured: Boolean(process.env.MONGODB_URI),
        r2Configured: isR2Configured()
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load settings.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    await connectMongo();
    const body = await request.json();
    if (body.marketplaceId) await setSetting("marketplaceId", body.marketplaceId);
    if (body.searchRunsPerDay) await setSetting("searchRunsPerDay", body.searchRunsPerDay);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save settings.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
