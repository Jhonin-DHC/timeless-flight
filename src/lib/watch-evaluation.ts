import { searchEbayListings, type NormalizedEbayResult } from "@/lib/ebay";

export type EvaluationStats = {
  compsCount: number;
  compsMinUsd?: number;
  compsMaxUsd?: number;
  compsAvgUsd?: number;
  compsMedianUsd?: number;
  estimatedLowUsd?: number;
  estimatedHighUsd?: number;
  estimatedMidUsd?: number;
  comps: NormalizedEbayResult[];
  searchKeywords: string;
};

function percentile(sorted: number[], p: number) {
  if (sorted.length === 0) return undefined;
  if (sorted.length === 1) return sorted[0];
  const index = (sorted.length - 1) * p;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  const weight = index - lower;
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

export function buildWatchSearchKeywords(input: {
  brand?: string;
  model?: string;
  referenceNumber?: string;
  displayName?: string;
  searchKeywords?: string;
}) {
  if (input.searchKeywords?.trim()) return input.searchKeywords.trim();
  const parts = [input.brand, input.model, input.referenceNumber].map((part) => part?.trim()).filter(Boolean);
  if (parts.length > 0) return parts.join(" ");
  return (input.displayName || "").trim();
}

export function computeEvaluationStats(comps: NormalizedEbayResult[], searchKeywords: string): EvaluationStats {
  const prices = comps.map((item) => item.price).filter((price) => Number.isFinite(price) && price > 0);
  const sorted = [...prices].sort((a, b) => a - b);

  if (sorted.length === 0) {
    return { compsCount: 0, comps: [], searchKeywords };
  }

  const sum = sorted.reduce((acc, value) => acc + value, 0);
  const avg = sum / sorted.length;
  const median = percentile(sorted, 0.5);
  const low = percentile(sorted, 0.25);
  const high = percentile(sorted, 0.75);

  return {
    compsCount: sorted.length,
    compsMinUsd: sorted[0],
    compsMaxUsd: sorted[sorted.length - 1],
    compsAvgUsd: Math.round(avg),
    compsMedianUsd: median != null ? Math.round(median) : undefined,
    estimatedLowUsd: low != null ? Math.round(low) : undefined,
    estimatedHighUsd: high != null ? Math.round(high) : undefined,
    estimatedMidUsd: median != null ? Math.round(median) : Math.round(avg),
    comps: comps.slice(0, 40),
    searchKeywords
  };
}

export async function evaluateWatchAgainstEbay(input: {
  brand?: string;
  model?: string;
  referenceNumber?: string;
  displayName?: string;
  searchKeywords?: string;
  marketplaceId?: string;
  limit?: number;
}) {
  const keywords = buildWatchSearchKeywords(input);
  if (!keywords) {
    throw new Error("Add brand, model, reference, or search keywords before evaluating.");
  }

  const comps = await searchEbayListings({
    keywords,
    marketplaceId: input.marketplaceId || process.env.EBAY_MARKETPLACE_ID || "EBAY_US",
    limit: input.limit ?? 50
  });

  return computeEvaluationStats(comps, keywords);
}
