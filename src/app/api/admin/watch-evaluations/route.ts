import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import { buildWatchSearchKeywords } from "@/lib/watch-evaluation";
import { WatchEvaluation } from "@/models/WatchEvaluation";

function normalizeBody(body: Record<string, unknown>) {
  const brand = typeof body.brand === "string" ? body.brand.trim() : "";
  const displayName =
    typeof body.displayName === "string" && body.displayName.trim()
      ? body.displayName.trim()
      : [brand, typeof body.model === "string" ? body.model.trim() : "", typeof body.referenceNumber === "string" ? body.referenceNumber.trim() : ""]
          .filter(Boolean)
          .join(" ");

  return {
    displayName,
    brand,
    model: typeof body.model === "string" ? body.model.trim() : "",
    referenceNumber: typeof body.referenceNumber === "string" ? body.referenceNumber.trim() : "",
    year: typeof body.year === "number" ? body.year : body.year ? Number(body.year) : undefined,
    serialNumber: typeof body.serialNumber === "string" ? body.serialNumber.trim() : "",
    movementType: typeof body.movementType === "string" ? body.movementType : "",
    caseSizeMm:
      typeof body.caseSizeMm === "number" ? body.caseSizeMm : body.caseSizeMm ? Number(body.caseSizeMm) : undefined,
    caseMaterial: typeof body.caseMaterial === "string" ? body.caseMaterial.trim() : "",
    dialColor: typeof body.dialColor === "string" ? body.dialColor.trim() : "",
    braceletType: typeof body.braceletType === "string" ? body.braceletType.trim() : "",
    condition: typeof body.condition === "string" ? body.condition : "Excellent",
    boxIncluded: Boolean(body.boxIncluded),
    papersIncluded: Boolean(body.papersIncluded),
    lastServiceYear:
      typeof body.lastServiceYear === "number"
        ? body.lastServiceYear
        : body.lastServiceYear
          ? Number(body.lastServiceYear)
          : undefined,
    knownIssues: typeof body.knownIssues === "string" ? body.knownIssues.trim() : "",
    notes: typeof body.notes === "string" ? body.notes.trim() : "",
    photoUrls: Array.isArray(body.photoUrls) ? body.photoUrls.filter((url) => typeof url === "string") : [],
    source: typeof body.source === "string" ? body.source : "manual",
    sellInquiryId: typeof body.sellInquiryId === "string" ? body.sellInquiryId : "",
    offerPriceUsd:
      typeof body.offerPriceUsd === "number"
        ? body.offerPriceUsd
        : body.offerPriceUsd
          ? Number(body.offerPriceUsd)
          : undefined,
    targetSellPriceUsd:
      typeof body.targetSellPriceUsd === "number"
        ? body.targetSellPriceUsd
        : body.targetSellPriceUsd
          ? Number(body.targetSellPriceUsd)
          : undefined,
    costBasisUsd:
      typeof body.costBasisUsd === "number"
        ? body.costBasisUsd
        : body.costBasisUsd
          ? Number(body.costBasisUsd)
          : undefined,
    status: typeof body.status === "string" ? body.status : "draft",
    searchKeywords:
      typeof body.searchKeywords === "string"
        ? body.searchKeywords.trim()
        : buildWatchSearchKeywords({
            brand,
            model: typeof body.model === "string" ? body.model : "",
            referenceNumber: typeof body.referenceNumber === "string" ? body.referenceNumber : "",
            displayName
          }),
    marketplaceId: typeof body.marketplaceId === "string" ? body.marketplaceId : "EBAY_US",
    lastSoldPriceUsd:
      typeof body.lastSoldPriceUsd === "number"
        ? body.lastSoldPriceUsd
        : body.lastSoldPriceUsd
          ? Number(body.lastSoldPriceUsd)
          : undefined,
    lastSoldDate: body.lastSoldDate ? new Date(String(body.lastSoldDate)) : undefined,
    lastSoldSource: typeof body.lastSoldSource === "string" ? body.lastSoldSource.trim() : "",
    lastSoldUrl: typeof body.lastSoldUrl === "string" ? body.lastSoldUrl.trim() : ""
  };
}

export async function GET() {
  try {
    await connectMongo();
    const watches = await WatchEvaluation.find().sort({ updatedAt: -1 }).lean();
    return NextResponse.json({ watches });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load watches.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectMongo();
    const body = await request.json();
    const data = normalizeBody(body);
    if (!data.brand || !data.displayName) {
      return NextResponse.json({ error: "Brand and name are required." }, { status: 400 });
    }
    const watch = await WatchEvaluation.create(data);
    return NextResponse.json({ watch }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create watch.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
