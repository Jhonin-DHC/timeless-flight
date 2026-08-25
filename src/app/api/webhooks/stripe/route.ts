import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { connectMongo } from "@/lib/mongodb";
import { getStripe } from "@/lib/stripe";
import { AbandonedCart } from "@/models/AbandonedCart";
import { Order } from "@/models/Order";

export const runtime = "nodejs";

async function markCartRecovered(email: string | null | undefined, stripeSessionId?: string) {
  const normalized = typeof email === "string" ? email.trim().toLowerCase() : "";
  const filter: Record<string, unknown> = { status: "open" };
  if (normalized) {
    filter.email = normalized;
  } else if (stripeSessionId) {
    filter.stripeSessionId = stripeSessionId;
  } else {
    return;
  }

  await AbandonedCart.findOneAndUpdate(filter, {
    $set: {
      status: "recovered",
      recoveredAt: new Date(),
      ...(stripeSessionId ? { stripeSessionId } : {})
    }
  });
}

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: "STRIPE_WEBHOOK_SECRET is not configured." }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header." }, { status: 400 });
  }

  const stripe = getStripe();
  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid webhook signature.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    await connectMongo();

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const paymentIntentId =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id || "";
      const paidEmail = session.customer_details?.email || session.customer_email || session.metadata?.customerEmail;

      await Order.findOneAndUpdate(
        { stripeSessionId: session.id },
        {
          $set: {
            status: "paid",
            stripePaymentIntentId: paymentIntentId,
            paidAt: new Date(),
            customerEmail: paidEmail || undefined,
            customerName: session.metadata?.customerName || undefined,
            totalUsd:
              typeof session.amount_total === "number" ? session.amount_total / 100 : undefined
          }
        }
      );

      await markCartRecovered(paidEmail, session.id);
    }

    if (event.type === "checkout.session.expired") {
      const session = event.data.object as Stripe.Checkout.Session;
      await Order.findOneAndUpdate(
        { stripeSessionId: session.id, status: "pending" },
        { $set: { status: "canceled" } }
      );
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook handler failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
