import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import { Order } from "@/models/Order";

export async function GET(request: Request) {
  try {
    await connectMongo();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "paid";

    const filter: Record<string, unknown> = {};
    if (status === "shipped") {
      filter.trackingNumber = { $exists: true, $nin: ["", null] };
    } else if (status !== "all") {
      filter.status = status;
    }

    const orders = await Order.find(filter).sort({ paidAt: -1, createdAt: -1 }).limit(200).lean();
    const paidCount = await Order.countDocuments({ status: "paid" });
    const awaitingShipCount = await Order.countDocuments({
      status: "paid",
      $or: [{ trackingNumber: "" }, { trackingNumber: null }, { trackingNumber: { $exists: false } }]
    });

    return NextResponse.json({ orders, paidCount, awaitingShipCount });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load orders.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
