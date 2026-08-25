import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import { AbandonedCart } from "@/models/AbandonedCart";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await connectMongo();
    const { id } = await context.params;
    const body = await request.json();

    const update: Record<string, unknown> = {};
    if (typeof body.adminNotes === "string") update.adminNotes = body.adminNotes;
    if (body.status === "dismissed") {
      update.status = "dismissed";
      update.dismissedAt = new Date();
    }
    if (body.status === "open") {
      update.status = "open";
      update.dismissedAt = undefined;
      update.recoveredAt = undefined;
    }

    const cart = await AbandonedCart.findByIdAndUpdate(id, { $set: update }, { new: true }).lean();
    if (!cart) {
      return NextResponse.json({ error: "Cart not found." }, { status: 404 });
    }

    return NextResponse.json({ cart });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update cart.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
