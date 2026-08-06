/** Shared parse/normalize helpers for Watch Evaluation create/update payloads. */

function num(value: unknown): number | undefined {
  if (value === "" || value === null || value === undefined || value === "-") return undefined;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : value == null ? "" : String(value).trim();
}

export function normalizeWatchEvaluationBody(body: Record<string, unknown>) {
  const brand = str(body.brand);
  const model = str(body.model);
  const referenceNumber = str(body.referenceNumber);
  const displayName =
    str(body.displayName) ||
    [brand, model, referenceNumber].filter(Boolean).join(" ");

  return {
    displayName,
    brand,
    model,
    referenceNumber,
    year: num(body.year),
    serialNumber: str(body.serialNumber),
    movementType: str(body.movementType),
    caseSizeMm: num(body.caseSizeMm),
    caseMaterial: str(body.caseMaterial),
    dialColor: str(body.dialColor),
    braceletType: str(body.braceletType),
    condition: str(body.condition) || "Excellent",
    boxIncluded: Boolean(body.boxIncluded),
    papersIncluded: Boolean(body.papersIncluded),
    lastServiceYear: num(body.lastServiceYear),
    knownIssues: str(body.knownIssues),
    notes: str(body.notes),
    photoUrls: Array.isArray(body.photoUrls) ? body.photoUrls.filter((url) => typeof url === "string") : [],
    source: str(body.source) || "manual",
    sellInquiryId: str(body.sellInquiryId),
    offerPriceUsd: num(body.offerPriceUsd),
    targetSellPriceUsd: num(body.targetSellPriceUsd),
    costBasisUsd: num(body.costBasisUsd),
    status: str(body.status) || "draft",
    searchKeywords: str(body.searchKeywords),
    marketplaceId: str(body.marketplaceId) || "EBAY_US",
    lastSoldPriceUsd: num(body.lastSoldPriceUsd),
    lastSoldDate: body.lastSoldDate ? new Date(String(body.lastSoldDate)) : undefined,
    lastSoldSource: str(body.lastSoldSource),
    lastSoldUrl: str(body.lastSoldUrl),
    authorizedDealerPriceUsd: num(body.authorizedDealerPriceUsd),
    watchChartsEstimateUsd: num(body.watchChartsEstimateUsd),
    recentSoldVariant: str(body.recentSoldVariant),
    brandNewPremiumPct: num(body.brandNewPremiumPct),
    withoutBoxPapersPct: num(body.withoutBoxPapersPct),
    marketVolatility: num(body.marketVolatility),
    riskScore: num(body.riskScore),
    riskScoreLabel: str(body.riskScoreLabel),
    salesVolume1Y: num(body.salesVolume1Y),
    medianDaysOnMarket: num(body.medianDaysOnMarket),
    importSource: str(body.importSource),
    externalKey: str(body.externalKey)
  };
}
