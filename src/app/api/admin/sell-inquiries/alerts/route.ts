import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import { SellInquiry } from "@/models/SellInquiry";

export async function GET() {
  try {
    await connectMongo();
    const unreadCount = await SellInquiry.countDocuments({ isUnread: true });
    return NextResponse.json({ unreadCount });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load alert count.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
