import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { Order } from "@/models/Order";

export async function GET(request: Request) {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json({ error: "Stripe is not configured." }, { status: 503 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("session_id");
    if (!sessionId) {
      return NextResponse.json({ error: "session_id is required." }, { status: 400 });
    }

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    await connectMongo();
    const order = await Order.findOne({ stripeSessionId: sessionId }).lean();

    return NextResponse.json({
      session: {
        id: session.id,
        status: session.status,
        paymentStatus: session.payment_status,
        customerEmail: session.customer_details?.email || session.customer_email,
        amountTotal: typeof session.amount_total === "number" ? session.amount_total / 100 : null,
        currency: session.currency
      },
      order: order
        ? {
            id: order._id.toString(),
            status: order.status,
            customerName: order.customerName,
            customerEmail: order.customerEmail,
            items: order.items,
            subtotalUsd: order.subtotalUsd,
            discountUsd: order.discountUsd,
            totalUsd: order.totalUsd,
            paidAt: order.paidAt
          }
        : null
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load checkout session.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
