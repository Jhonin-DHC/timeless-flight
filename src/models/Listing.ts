import mongoose, { Schema, models } from "mongoose";

const ListingSchema = new Schema(
  {
    storefrontProductId: { type: String, default: "" },
    slug: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    brand: { type: String, required: true },
    referenceNumber: { type: String, default: "" },
    collection: { type: String, default: "" },
    condition: {
      type: String,
      enum: ["New", "Excellent", "Very Good", "Good", "Fair"],
      required: true
    },
    year: { type: Number, required: true },
    priceUsd: { type: Number, required: true },
    imageUrl: { type: String, required: true },
    imageUrls: { type: [String], default: [] },
    description: { type: String, required: true },
    published: { type: Boolean, default: true },
    category: { type: String, enum: ["shop", "vintage", "project"], default: "shop" },
    inStock: { type: Boolean, default: true },
    availabilityNote: { type: String, default: "" },
    limitedEdition: { type: Boolean, default: false },
    callForPricing: { type: Boolean, default: false },
    productionQuantity: { type: String, default: "" },
    buyChannel: { type: String, enum: ["ghl", "ebay"], default: "ghl" },
    ebayItemId: { type: String, default: "" }
  },
  { timestamps: true, suppressReservedKeysWarning: true }
);

export const Listing = models.Listing || mongoose.model("Listing", ListingSchema);
