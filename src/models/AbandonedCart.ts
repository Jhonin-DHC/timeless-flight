import mongoose, { Schema, models } from "mongoose";

const AbandonedCartItemSchema = new Schema(
  {
    productId: { type: String, required: true },
    listingId: { type: String, default: "" },
    name: { type: String, required: true },
    priceUsd: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 }
  },
  { _id: false }
);

const AbandonedCartSchema = new Schema(
  {
    email: { type: String, required: true, index: true },
    customerName: { type: String, default: "" },
    items: { type: [AbandonedCartItemSchema], default: [] },
    subtotalUsd: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["open", "recovered", "dismissed"],
      default: "open",
      index: true
    },
    stripeSessionId: { type: String, default: "", index: true },
    lastActivityAt: { type: Date, default: Date.now, index: true },
    recoveredAt: { type: Date },
    dismissedAt: { type: Date },
    adminNotes: { type: String, default: "" }
  },
  { timestamps: true }
);

AbandonedCartSchema.index({ email: 1, status: 1 });

export const AbandonedCart =
  models.AbandonedCart || mongoose.model("AbandonedCart", AbandonedCartSchema);
