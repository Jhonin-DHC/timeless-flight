import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import { AbandonedCart } from "@/models/AbandonedCart";

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const customerName = typeof body.customerName === "string" ? body.customerName.trim() : "";
    const stripeSessionId = typeof body.stripeSessionId === "string" ? body.stripeSessionId.trim() : "";
    const items = Array.isArray(body.items) ? body.items : [];

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
    }
    if (items.length === 0) {
      return NextResponse.json({ error: "Cart is empty." }, { status: 400 });
    }

    const normalizedItems = items.map((item: Record<string, unknown>) => {
      const quantity = Math.max(1, Math.floor(Number(item.quantity) || 1));
      const priceUsd = Number(item.price ?? item.priceUsd);
      const productId = String(item.productId || "");
      const name = String(item.name || "");
      if (!productId || !name || !Number.isFinite(priceUsd) || priceUsd < 0) {
        throw new Error("Invalid cart item.");
      }
      return {
        productId,
        listingId: item.listingId ? String(item.listingId) : "",
        name,
        priceUsd,
        quantity
      };
    });

    const subtotalUsd = normalizedItems.reduce(
      (sum: number, item: { priceUsd: number; quantity: number }) => sum + item.priceUsd * item.quantity,
      0
    );

    await connectMongo();

    const cart = await AbandonedCart.findOneAndUpdate(
      { email, status: "open" },
      {
        $set: {
          email,
          customerName,
          items: normalizedItems,
          subtotalUsd,
          lastActivityAt: new Date(),
          ...(stripeSessionId ? { stripeSessionId } : {})
        },
        $setOnInsert: {
          status: "open"
        }
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      ok: true,
      id: String(cart._id),
      email: cart.email,
      subtotalUsd: cart.subtotalUsd
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save cart.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
