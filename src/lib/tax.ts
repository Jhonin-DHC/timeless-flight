import { dollarsToCents, getStripe, isStripeConfigured } from "@/lib/stripe";

/** Stripe Tax code for wristwatches. */
export const WATCH_TAX_CODE = "txcd_30060016";
/** Forces Stripe Tax to skip this amount even in jurisdictions that tax shipping. */
export const NONTAXABLE_TAX_CODE = "txcd_00000000";

export type TaxAddress = {
  line1?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
};

export type WatchTaxQuote = {
  amountUsd: number;
  quoted: boolean;
};

function roundUsd(amount: number) {
  return Math.round(amount * 100) / 100;
}

export function hasTaxableAddress(address?: TaxAddress | null) {
  const state = (address?.state || "").trim().toUpperCase();
  const postalCode = (address?.postalCode || "").replace(/\D/g, "").slice(0, 5);
  return /^[A-Z]{2}$/.test(state) && /^\d{5}$/.test(postalCode);
}

/**
 * Sales tax on the watch merchandise only. Shipping and insurance are never part of the tax base.
 */
export async function quoteWatchTax(
  merchandiseUsd: number,
  address?: TaxAddress | null
): Promise<WatchTaxQuote> {
  const taxable = Math.max(0, roundUsd(Number(merchandiseUsd) || 0));
  if (taxable <= 0) return { amountUsd: 0, quoted: true };
  if (!isStripeConfigured() || !hasTaxableAddress(address)) {
    return { amountUsd: 0, quoted: false };
  }

  try {
    const calculation = await getStripe().tax.calculations.create({
      currency: "usd",
      customer_details: {
        address: {
          line1: address?.line1?.trim() || undefined,
          city: address?.city?.trim() || undefined,
          state: (address?.state || "").trim().toUpperCase(),
          postal_code: (address?.postalCode || "").replace(/\D/g, "").slice(0, 5),
          country: address?.country?.trim() || "US"
        },
        address_source: "shipping"
      },
      line_items: [
        {
          amount: dollarsToCents(taxable),
          quantity: 1,
          reference: "watch",
          tax_behavior: "exclusive",
          tax_code: WATCH_TAX_CODE
        }
      ]
    });

    const exclusive = typeof calculation.tax_amount_exclusive === "number" ? calculation.tax_amount_exclusive : 0;
    const inclusive = typeof calculation.tax_amount_inclusive === "number" ? calculation.tax_amount_inclusive : 0;
    return { amountUsd: roundUsd((exclusive + inclusive) / 100), quoted: true };
  } catch {
    return { amountUsd: 0, quoted: false };
  }
}

export function isAutomaticTaxUnavailable(error: unknown) {
  const err = error as { code?: string; message?: string; raw?: { code?: string; message?: string } };
  const code = `${err.code || ""} ${err.raw?.code || ""}`;
  const message = `${err.message || ""} ${err.raw?.message || ""}`;
  return (
    /automatic_tax/i.test(code) ||
    /automatic tax/i.test(message) ||
    /Stripe Tax has not been activated/i.test(message)
  );
}
