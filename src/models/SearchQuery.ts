import mongoose, { Schema, models } from "mongoose";

const SearchQuerySchema = new Schema(
  {
    name: { type: String, required: true },
    keywords: { type: String, required: true },
    marketplaceId: { type: String, default: "EBAY_US" },
    minPrice: { type: Number },
    maxPrice: { type: Number },
    resultLimit: { type: Number, default: 50 },
    enabled: { type: Boolean, default: true },
    lastRunAt: { type: Date }
  },
  { timestamps: true }
);

export const SearchQuery = models.SearchQuery || mongoose.model("SearchQuery", SearchQuerySchema);
