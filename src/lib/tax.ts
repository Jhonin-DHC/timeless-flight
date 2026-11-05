export const DEFAULT_TAX_PERCENT = 8.25;

export type TaxSettings = {
  percent: number;
};

export type WatchTaxQuote = {
  amountUsd: number;
  percent: number;
  quoted: boolean;
};

function roundUsd(amount: number) {
  return Math.round(amount * 100) / 100;
}

export function normalizeTaxPercent(value: unknown, fallback = DEFAULT_TAX_PERCENT) {
  const amount = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(amount) || amount < 0) return fallback;
  return Math.min(100, Math.round(amount * 10000) / 10000);
}

export function normalizeTaxSettings(input?: Partial<TaxSettings> | null): TaxSettings {
  return {
    percent: normalizeTaxPercent(input?.percent)
  };
}

/**
 * Sales tax on the watch merchandise only. Shipping and insurance are never part of the tax base.
 */
export function quoteWatchTax(
  merchandiseUsd: number,
  percent: number = DEFAULT_TAX_PERCENT
): WatchTaxQuote {
  const taxable = Math.max(0, roundUsd(Number(merchandiseUsd) || 0));
  const rate = normalizeTaxPercent(percent);
  return {
    amountUsd: roundUsd((taxable * rate) / 100),
    percent: rate,
    quoted: true
  };
}
