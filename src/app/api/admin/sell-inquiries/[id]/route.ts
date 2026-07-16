import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import { SellInquiry } from "@/models/SellInquiry";

interface RouteProps {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteProps) {
  try {
    const { id } = await params;
    await connectMongo();
    const inquiry = await SellInquiry.findById(id).lean();
    if (!inquiry) {
      return NextResponse.json({ error: "Inquiry not found." }, { status: 404 });
    }
    return NextResponse.json({ inquiry });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load inquiry.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: RouteProps) {
  try {
    const { id } = await params;
    await connectMongo();
    const body = (await request.json()) as {
      status?: "new" | "reviewed" | "replied" | "closed";
      isUnread?: boolean;
      adminNotes?: string;
      reply?: string;
      markRead?: boolean;
    };

    const inquiry = await SellInquiry.findById(id);
    if (!inquiry) {
      return NextResponse.json({ error: "Inquiry not found." }, { status: 404 });
    }

    if (typeof body.adminNotes === "string") {
      inquiry.adminNotes = body.adminNotes;
    }
    if (typeof body.isUnread === "boolean") {
      inquiry.isUnread = body.isUnread;
    }
    if (body.markRead) {
      inquiry.isUnread = false;
      if (inquiry.status === "new") inquiry.status = "reviewed";
    }
    if (body.status) {
      inquiry.status = body.status;
      if (body.status !== "new") inquiry.isUnread = false;
    }
    if (body.reply?.trim()) {
      inquiry.replies.push({
        body: body.reply.trim(),
        createdBy: "admin",
        createdAt: new Date()
      });
      inquiry.status = "replied";
      inquiry.isUnread = false;
    }

    await inquiry.save();
    return NextResponse.json({ inquiry });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update inquiry.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteProps) {
  try {
    const { id } = await params;
    await connectMongo();
    const inquiry = await SellInquiry.findByIdAndDelete(id);
    if (!inquiry) {
      return NextResponse.json({ error: "Inquiry not found." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete inquiry.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
