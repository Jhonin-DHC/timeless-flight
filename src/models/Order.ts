import mongoose, { Schema, models } from "mongoose";

const OrderItemSchema = new Schema(
  {
    productId: { type: String, required: true },
    listingId: { type: String, default: "" },
    name: { type: String, required: true },
    priceUsd: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 }
  },
  { _id: false }
);

const ShippingAddressSchema = new Schema(
  {
    line1: { type: String, default: "" },
    city: { type: String, default: "" },
    state: { type: String, default: "" },
    postalCode: { type: String, default: "" },
    country: { type: String, default: "US" }
  },
  { _id: false }
);

const OrderSchema = new Schema(
  {
    stripeSessionId: { type: String, required: true, unique: true, index: true },
    stripePaymentIntentId: { type: String, default: "", index: true },
    customerEmail: { type: String, required: true, index: true },
    customerName: { type: String, default: "" },
    referralEmail: { type: String, default: "" },
    couponCode: { type: String, default: "" },
    discountUsd: { type: Number, default: 0 },
    subtotalUsd: { type: Number, required: true },
    shippingUsd: { type: Number, default: 0 },
    shippingMethod: { type: String, enum: ["ground", "overnight", ""], default: "" },
    shippingZone: { type: String, enum: ["local", "us", ""], default: "" },
    shippingLabel: { type: String, default: "" },
    shippingAddress: { type: ShippingAddressSchema, default: () => ({}) },
    totalUsd: { type: Number, required: true },
    currency: { type: String, default: "usd" },
    status: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded", "canceled"],
      default: "pending",
      index: true
    },
    items: { type: [OrderItemSchema], default: [] },
    paidAt: { type: Date },
    carrier: { type: String, enum: ["ups", "fedex", ""], default: "" },
    trackingNumber: { type: String, default: "" },
    shippedAt: { type: Date, default: null },
    purchaseEmailSentAt: { type: Date, default: null },
    shippingEmailSentAt: { type: Date, default: null }
  },
  { timestamps: true }
);

export const Order = models.Order || mongoose.model("Order", OrderSchema);
