import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import { AbandonedCart } from "@/models/AbandonedCart";

export async function GET(request: Request) {
  try {
    await connectMongo();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "open";

    const filter: Record<string, unknown> = {};
    if (status !== "all") filter.status = status;

    const carts = await AbandonedCart.find(filter).sort({ lastActivityAt: -1 }).limit(200).lean();
    const openCount = await AbandonedCart.countDocuments({ status: "open" });

    return NextResponse.json({ carts, openCount });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load abandoned carts.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
