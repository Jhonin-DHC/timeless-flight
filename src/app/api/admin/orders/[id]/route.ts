import { NextResponse } from "next/server";
import { isEmailConfigured, sendOrderShippedEmail } from "@/lib/email";
import { connectMongo } from "@/lib/mongodb";
import { isShippingCarrier } from "@/lib/shipping";
import { Order } from "@/models/Order";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await connectMongo();
    const { id } = await context.params;
    const body = await request.json();

    const carrier = typeof body.carrier === "string" ? body.carrier.trim().toLowerCase() : "";
    const trackingNumber = typeof body.trackingNumber === "string" ? body.trackingNumber.trim() : "";

    if (!isShippingCarrier(carrier)) {
      return NextResponse.json({ error: "Choose UPS or FedEx." }, { status: 400 });
    }
    if (!trackingNumber) {
      return NextResponse.json({ error: "Tracking number is required." }, { status: 400 });
    }

    const order = await Order.findByIdAndUpdate(
      id,
      {
        $set: {
          carrier,
          trackingNumber,
          shippedAt: new Date()
        }
      },
      { new: true }
    );

    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    let emailSent = false;
    let emailError: string | null = null;
    if (!isEmailConfigured()) {
      emailError = "SMTP is not configured, so the buyer was not emailed.";
    } else if (!order.customerEmail) {
      emailError = "This order has no customer email.";
    } else {
      try {
        await sendOrderShippedEmail({
          customerName: order.customerName,
          customerEmail: order.customerEmail,
          items: order.items,
          subtotalUsd: order.subtotalUsd,
          discountUsd: order.discountUsd,
          shippingUsd: order.shippingUsd,
          shippingLabel: order.shippingLabel,
          shippingAddress: order.shippingAddress,
          totalUsd: order.totalUsd,
          couponCode: order.couponCode,
          carrier: order.carrier,
          trackingNumber: order.trackingNumber
        });
        await Order.updateOne({ _id: order._id }, { $set: { shippingEmailSentAt: new Date() } });
        order.shippingEmailSentAt = new Date();
        emailSent = true;
      } catch (error) {
        emailError = error instanceof Error ? error.message : "Failed to email the buyer.";
      }
    }

    return NextResponse.json({ order, emailSent, emailError });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update order.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
