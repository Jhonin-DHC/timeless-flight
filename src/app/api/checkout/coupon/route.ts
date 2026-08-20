import { NextResponse } from "next/server";
import { getStripe, isStripeConfigured } from "@/lib/stripe";

export async function POST(request: Request) {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json({ error: "Stripe is not configured." }, { status: 503 });
    }

    const body = await request.json();
    const code = typeof body.code === "string" ? body.code.trim().toUpperCase() : "";
    const cartTotal =
      typeof body.cartTotal === "number" && Number.isFinite(body.cartTotal) ? Math.max(0, body.cartTotal) : 0;

    if (!code) {
      return NextResponse.json({ error: "Coupon code is required." }, { status: 400 });
    }

    const stripe = getStripe();
    const list = await stripe.promotionCodes.list({
      code,
      active: true,
      limit: 1,
      expand: ["data.promotion.coupon"]
    });

    const promo = list.data[0];
    if (!promo) {
      return NextResponse.json({ error: "Coupon is invalid or inactive." }, { status: 400 });
    }

    const coupon =
      typeof promo.promotion?.coupon === "object" && promo.promotion.coupon !== null
        ? promo.promotion.coupon
        : null;

    if (!coupon || coupon.valid === false) {
      return NextResponse.json({ error: "Coupon is invalid or inactive." }, { status: 400 });
    }

    const percentOff = typeof coupon.percent_off === "number" ? coupon.percent_off : 0;
    const amountOffCents = typeof coupon.amount_off === "number" ? coupon.amount_off : 0;

    let discountAmount = 0;
    if (percentOff > 0) {
      discountAmount = Math.round(((cartTotal * percentOff) / 100) * 100) / 100;
    } else if (amountOffCents > 0) {
      discountAmount = Math.min(cartTotal, amountOffCents / 100);
    }

    if (discountAmount <= 0) {
      return NextResponse.json({ error: "Coupon has no usable discount." }, { status: 400 });
    }

    return NextResponse.json({
      valid: true,
      code: promo.code,
      promotionCodeId: promo.id,
      percentOff,
      discountAmount,
      message: percentOff > 0 ? `${percentOff}% off applied.` : "Discount applied."
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to validate coupon.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
