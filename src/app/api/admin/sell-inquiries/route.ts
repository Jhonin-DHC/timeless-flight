import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import { SellInquiry } from "@/models/SellInquiry";

export async function GET(request: Request) {
  try {
    await connectMongo();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const unreadOnly = searchParams.get("unreadOnly") === "true";

    const filter: Record<string, unknown> = {};
    if (status && status !== "all") filter.status = status;
    if (unreadOnly) filter.isUnread = true;

    const [inquiries, unreadCount] = await Promise.all([
      SellInquiry.find(filter).sort({ createdAt: -1 }).limit(200).lean(),
      SellInquiry.countDocuments({ isUnread: true })
    ]);

    return NextResponse.json({ inquiries, unreadCount });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load sell inquiries.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
