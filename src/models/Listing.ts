import mongoose, { Schema, models } from "mongoose";

const ListingSchema = new Schema(
  {
    storefrontProductId: { type: String, default: "" },
    slug: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    brand: { type: String, required: true },
    condition: { type: String, enum: ["New", "Excellent", "Very Good"], required: true },
    year: { type: Number, required: true },
    priceUsd: { type: Number, required: true },
    imageUrl: { type: String, required: true },
    imageUrls: { type: [String], default: [] },
    description: { type: String, required: true },
    published: { type: Boolean, default: true },
    buyChannel: { type: String, enum: ["ghl", "ebay"], default: "ghl" },
    ebayItemId: { type: String, default: "" }
  },
  { timestamps: true }
);

export const Listing = models.Listing || mongoose.model("Listing", ListingSchema);
