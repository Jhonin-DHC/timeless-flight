import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import { dollarsToCents, getSiteUrl, getStripe, isStripeConfigured } from "@/lib/stripe";
import { Order } from "@/models/Order";
import type Stripe from "stripe";

interface CheckoutItem {
  productId: string;
  listingId?: string;
  name: string;
  price: number;
  quantity: number;
}

async function resolvePromotionCode(stripe: Stripe, code: string) {
  const list = await stripe.promotionCodes.list({
    code: code.toUpperCase(),
    active: true,
    limit: 1,
    expand: ["data.promotion.coupon"]
  });
  const promo = list.data[0];
  if (!promo) return null;

  const coupon =
    typeof promo.promotion?.coupon === "object" && promo.promotion.coupon !== null
      ? promo.promotion.coupon
      : null;
  if (!coupon || coupon.valid === false) return null;

  return { promo, coupon };
}

function estimateDiscountUsd(coupon: Stripe.Coupon, subtotalUsd: number) {
  if (typeof coupon.percent_off === "number" && coupon.percent_off > 0) {
    return Math.round(((subtotalUsd * coupon.percent_off) / 100) * 100) / 100;
  }
  if (typeof coupon.amount_off === "number" && coupon.amount_off > 0) {
    return Math.min(subtotalUsd, coupon.amount_off / 100);
  }
  return 0;
}

export async function POST(request: Request) {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: "Stripe is not configured. Set STRIPE_SECRET_KEY and NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY." },
        { status: 503 }
      );
    }

    const body = await request.json();
    const customerEmail = typeof body.customerEmail === "string" ? body.customerEmail.trim() : "";
    const customerName = typeof body.customerName === "string" ? body.customerName.trim() : "";
    const referralEmail = typeof body.referralEmail === "string" ? body.referralEmail.trim() : "";
    const couponCode = typeof body.couponCode === "string" ? body.couponCode.trim().toUpperCase() : "";
    const items = Array.isArray(body.items) ? (body.items as CheckoutItem[]) : [];

    if (!customerEmail || !customerName) {
      return NextResponse.json({ error: "Name and email are required." }, { status: 400 });
    }
    if (items.length === 0) {
      return NextResponse.json({ error: "Cart is empty." }, { status: 400 });
    }

    const normalizedItems = items.map((item) => {
      const quantity = Math.max(1, Math.floor(Number(item.quantity) || 1));
      const price = Number(item.price);
      if (!item.productId || !item.name || !Number.isFinite(price) || price < 0) {
        throw new Error("Each cart item needs productId, name, and a valid price.");
      }
      return {
        productId: String(item.productId),
        listingId: item.listingId ? String(item.listingId) : "",
        name: String(item.name),
        priceUsd: price,
        quantity
      };
    });

    const subtotalUsd = normalizedItems.reduce((sum, item) => sum + item.priceUsd * item.quantity, 0);

    const stripe = getStripe();
    const siteUrl = getSiteUrl();

    let discountUsd = 0;
    let promotionCodeId: string | undefined;
    let percentOff = 0;

    if (couponCode) {
      const resolved = await resolvePromotionCode(stripe, couponCode);
      if (!resolved) {
        return NextResponse.json({ error: "Coupon is invalid or inactive." }, { status: 400 });
      }
      discountUsd = estimateDiscountUsd(resolved.coupon, subtotalUsd);
      promotionCodeId = resolved.promo.id;
      percentOff = resolved.coupon.percent_off ?? 0;
      if (discountUsd <= 0) {
        return NextResponse.json({ error: "Coupon has no usable discount." }, { status: 400 });
      }
    }

    const totalUsd = Math.max(0, Math.round((subtotalUsd - discountUsd) * 100) / 100);
    // Stripe allows $0 when a 100% coupon applies; otherwise enforce the $0.50 floor.
    if (totalUsd > 0 && totalUsd < 0.5) {
      return NextResponse.json({ error: "Order total must be at least $0.50 for Stripe Checkout." }, { status: 400 });
    }

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: "payment",
      customer_email: customerEmail,
      client_reference_id: customerEmail,
      line_items: normalizedItems.map((item) => ({
        quantity: item.quantity,
        price_data: {
          currency: "usd",
          unit_amount: dollarsToCents(item.priceUsd),
          product_data: {
            name: item.name,
            metadata: {
              productId: item.productId,
              listingId: item.listingId
            }
          }
        }
      })),
      success_url: `${siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/checkout?canceled=1`,
      metadata: {
        customerName,
        customerEmail,
        referralEmail,
        couponCode,
        discountUsd: String(discountUsd),
        percentOff: String(percentOff)
      },
      payment_intent_data: {
        metadata: {
          customerName,
          customerEmail,
          couponCode
        }
      }
    };

    if (promotionCodeId) {
      sessionParams.discounts = [{ promotion_code: promotionCodeId }];
    } else {
      sessionParams.allow_promotion_codes = true;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);
    if (!session.url) {
      return NextResponse.json({ error: "Stripe did not return a checkout URL." }, { status: 502 });
    }

    await connectMongo();
    await Order.create({
      stripeSessionId: session.id,
      customerEmail,
      customerName,
      referralEmail,
      couponCode,
      discountUsd,
      subtotalUsd,
      totalUsd,
      currency: "usd",
      status: "pending",
      items: normalizedItems
    });

    return NextResponse.json({
      ok: true,
      sessionId: session.id,
      url: session.url
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create Stripe checkout.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
