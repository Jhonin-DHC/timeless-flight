import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import XLSX from "xlsx";

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI is required.");
  process.exit(1);
}

function cleanText(value) {
  if (value == null) return "";
  return String(value).replace(/\s+/g, " ").trim();
}

function cleanRef(value) {
  return cleanText(value).replace(/^ref\.?\s*/i, "");
}

function num(value) {
  if (value == null || value === "" || value === "-") return undefined;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const n = Number(String(value).replace(/[,$]/g, "").trim());
  return Number.isFinite(n) ? n : undefined;
}

function parsePremiumPct(value) {
  if (value == null || value === "" || value === "-") return undefined;
  if (typeof value === "number") return value;
  const match = String(value).match(/([+-]?\d+(?:\.\d+)?)\s*%/);
  if (!match) return undefined;
  return Number(match[1]) / 100;
}

function parseRisk(value) {
  if (value == null || value === "" || value === "-") return { riskScore: undefined, riskScoreLabel: "" };
  const label = cleanText(value);
  const match = label.match(/(\d+)\s*\/\s*100/);
  return {
    riskScore: match ? Number(match[1]) : num(value),
    riskScoreLabel: label
  };
}

function parseDate(value) {
  if (!value) return undefined;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

const WatchEvaluationSchema = new mongoose.Schema(
  {
    displayName: String,
    brand: String,
    model: String,
    referenceNumber: String,
    year: Number,
    serialNumber: { type: String, default: "" },
    movementType: { type: String, default: "" },
    caseSizeMm: Number,
    caseMaterial: { type: String, default: "" },
    dialColor: { type: String, default: "" },
    braceletType: { type: String, default: "" },
    condition: { type: String, default: "Excellent" },
    boxIncluded: { type: Boolean, default: false },
    papersIncluded: { type: Boolean, default: false },
    lastServiceYear: Number,
    knownIssues: { type: String, default: "" },
    notes: { type: String, default: "" },
    photoUrls: { type: [String], default: [] },
    source: { type: String, default: "import" },
    sellInquiryId: { type: String, default: "" },
    offerPriceUsd: Number,
    targetSellPriceUsd: Number,
    costBasisUsd: Number,
    status: { type: String, default: "draft" },
    searchKeywords: { type: String, default: "" },
    marketplaceId: { type: String, default: "EBAY_US" },
    lastEvaluatedAt: Date,
    compsCount: { type: Number, default: 0 },
    compsMinUsd: Number,
    compsMaxUsd: Number,
    compsAvgUsd: Number,
    compsMedianUsd: Number,
    estimatedLowUsd: Number,
    estimatedHighUsd: Number,
    estimatedMidUsd: Number,
    comps: { type: Array, default: [] },
    lastSoldPriceUsd: Number,
    lastSoldDate: Date,
    lastSoldSource: { type: String, default: "" },
    lastSoldUrl: { type: String, default: "" },
    authorizedDealerPriceUsd: Number,
    watchChartsEstimateUsd: Number,
    recentSoldVariant: { type: String, default: "" },
    brandNewPremiumPct: Number,
    withoutBoxPapersPct: Number,
    marketVolatility: Number,
    riskScore: Number,
    riskScoreLabel: { type: String, default: "" },
    salesVolume1Y: Number,
    medianDaysOnMarket: Number,
    importSource: { type: String, default: "" },
    externalKey: { type: String, default: "" }
  },
  { timestamps: true }
);

const WatchEvaluation =
  mongoose.models.WatchEvaluation || mongoose.model("WatchEvaluation", WatchEvaluationSchema);

async function main() {
  const filePath = path.resolve(process.cwd(), "public/public/Watch DATABASE.xlsx");
  if (!fs.existsSync(filePath)) {
    console.error("Excel not found:", filePath);
    process.exit(1);
  }

  const workbook = XLSX.readFile(filePath, { cellDates: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: null, raw: true });

  await mongoose.connect(uri);
  console.log("Connected. Rows in sheet:", rows.length);

  let brand = "BREITLING";
  let upserted = 0;
  let skipped = 0;

  for (const row of rows) {
    const model = cleanText(row["MODEL"]);
    const referenceNumber = cleanRef(row["REFERENCE NUMBER"]);
    if (row["BRAND"]) brand = cleanText(row["BRAND"]);
    if (!model && !referenceNumber) {
      skipped += 1;
      continue;
    }

    const risk = parseRisk(row["Risk Score"]);
    const watchChartsEstimateUsd = num(row["WatchCharts pre-owned price estimate"]);
    const lastSoldPriceUsd = num(row["LAST SOLD PRICE"]);
    const authorizedDealerPriceUsd = num(row["Price from authorized dealer"]);
    const displayName = [brand, model, referenceNumber ? `Ref. ${referenceNumber}` : ""].filter(Boolean).join(" ");
    const externalKey = `${brand}|${referenceNumber || model}`.toLowerCase();

    const doc = {
      displayName,
      brand,
      model,
      referenceNumber,
      condition: "Excellent",
      source: "import",
      status: lastSoldPriceUsd != null || watchChartsEstimateUsd != null ? "evaluating" : "draft",
      searchKeywords: [brand, model, referenceNumber].filter(Boolean).join(" "),
      marketplaceId: "EBAY_US",
      authorizedDealerPriceUsd,
      watchChartsEstimateUsd,
      recentSoldVariant: cleanText(row["RECENT SOLD MODEL / VARIANT"]),
      lastSoldPriceUsd,
      lastSoldDate: parseDate(row["RECENT SOLD DATE"]),
      lastSoldSource: lastSoldPriceUsd != null ? "Watch DATABASE.xlsx" : "",
      brandNewPremiumPct: parsePremiumPct(row["PRICE IF BRANDNEW +"]),
      withoutBoxPapersPct: num(row["WITHOUT BOX AND PAPERS"]),
      marketVolatility: num(row["Market Volatility"]),
      riskScore: risk.riskScore,
      riskScoreLabel: risk.riskScoreLabel,
      salesVolume1Y: num(row["1Y Sales Volume"]),
      medianDaysOnMarket: num(row["Median Days on Market"]),
      targetSellPriceUsd: watchChartsEstimateUsd,
      estimatedMidUsd: watchChartsEstimateUsd,
      importSource: "Watch DATABASE.xlsx",
      externalKey
    };

    await WatchEvaluation.findOneAndUpdate({ externalKey }, { $set: doc }, { upsert: true, new: true });
    upserted += 1;
    console.log(`Upserted ${upserted}: ${displayName}`);
  }

  const total = await WatchEvaluation.countDocuments({ importSource: "Watch DATABASE.xlsx" });
  console.log(`Done. upserted=${upserted} skipped=${skipped} importSource count=${total}`);
  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
