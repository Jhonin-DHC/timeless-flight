import mongoose, { Schema, models } from "mongoose";

const SearchResultSchema = new Schema(
  {
    searchQueryId: { type: Schema.Types.ObjectId, ref: "SearchQuery", required: true, index: true },
    queryName: { type: String, required: true },
    ebayItemId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    price: { type: Number, required: true },
    currency: { type: String, default: "USD" },
    condition: { type: String, default: "Unknown" },
    itemWebUrl: { type: String, required: true },
    imageUrl: { type: String, default: "" },
    sellerUsername: { type: String, default: "" },
    isUnseen: { type: Boolean, default: true },
    firstSeenAt: { type: Date, default: Date.now },
    lastSeenAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

SearchResultSchema.index({ searchQueryId: 1, ebayItemId: 1 }, { unique: true });

export const SearchResult = models.SearchResult || mongoose.model("SearchResult", SearchResultSchema);
