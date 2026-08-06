import mongoose, { Schema, models } from "mongoose";

const CompSnapshotSchema = new Schema(
  {
    ebayItemId: { type: String, required: true },
    title: { type: String, required: true },
    price: { type: Number, required: true },
    currency: { type: String, default: "USD" },
    condition: { type: String, default: "Unknown" },
    itemWebUrl: { type: String, default: "" },
    imageUrl: { type: String, default: "" },
    sellerUsername: { type: String, default: "" }
  },
  { _id: false }
);

const WatchEvaluationSchema = new Schema(
  {
    displayName: { type: String, required: true },
    brand: { type: String, required: true, index: true },
    model: { type: String, default: "" },
    referenceNumber: { type: String, default: "", index: true },
    year: { type: Number },
    serialNumber: { type: String, default: "" },
    movementType: {
      type: String,
      enum: ["", "Automatic", "Manual", "Quartz", "Other"],
      default: ""
    },
    caseSizeMm: { type: Number },
    caseMaterial: { type: String, default: "" },
    dialColor: { type: String, default: "" },
    braceletType: { type: String, default: "" },
    condition: {
      type: String,
      enum: ["New", "Excellent", "Very Good", "Good", "Fair", "Parts"],
      default: "Excellent"
    },
    boxIncluded: { type: Boolean, default: false },
    papersIncluded: { type: Boolean, default: false },
    lastServiceYear: { type: Number },
    knownIssues: { type: String, default: "" },
    notes: { type: String, default: "" },
    photoUrls: { type: [String], default: [] },
    source: {
      type: String,
      enum: ["manual", "buy", "trade-in", "sell-inquiry", "consignment", "import"],
      default: "manual"
    },
    sellInquiryId: { type: String, default: "" },
    offerPriceUsd: { type: Number },
    targetSellPriceUsd: { type: Number },
    costBasisUsd: { type: Number },
    status: {
      type: String,
      enum: ["draft", "evaluating", "offered", "bought", "passed"],
      default: "draft",
      index: true
    },
    searchKeywords: { type: String, default: "" },
    marketplaceId: { type: String, default: "EBAY_US" },
    // Active-comp evaluation (Browse API)
    lastEvaluatedAt: { type: Date },
    compsCount: { type: Number, default: 0 },
    compsMinUsd: { type: Number },
    compsMaxUsd: { type: Number },
    compsAvgUsd: { type: Number },
    compsMedianUsd: { type: Number },
    estimatedLowUsd: { type: Number },
    estimatedHighUsd: { type: Number },
    estimatedMidUsd: { type: Number },
    comps: { type: [CompSnapshotSchema], default: [] },
    // Sold comps
    lastSoldPriceUsd: { type: Number },
    lastSoldDate: { type: Date },
    lastSoldSource: { type: String, default: "" },
    lastSoldUrl: { type: String, default: "" },
    // Market database / WatchCharts columns
    authorizedDealerPriceUsd: { type: Number },
    watchChartsEstimateUsd: { type: Number },
    recentSoldVariant: { type: String, default: "" },
    brandNewPremiumPct: { type: Number },
    withoutBoxPapersPct: { type: Number },
    marketVolatility: { type: Number },
    riskScore: { type: Number },
    riskScoreLabel: { type: String, default: "" },
    salesVolume1Y: { type: Number },
    medianDaysOnMarket: { type: Number },
    importSource: { type: String, default: "" },
    externalKey: { type: String, default: "", index: true }
  },
  { timestamps: true }
);

export const WatchEvaluation =
  models.WatchEvaluation || mongoose.model("WatchEvaluation", WatchEvaluationSchema);
