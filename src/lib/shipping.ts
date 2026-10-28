export const SHIPPING_LOCAL_USD = 45;
export const SHIPPING_US_USD = 75;
export const SHIPPING_OVERNIGHT_USD = 175;

export type ShippingRates = {
  localUsd: number;
  usUsd: number;
  overnightUsd: number;
};

export const DEFAULT_SHIPPING_RATES: ShippingRates = {
  localUsd: SHIPPING_LOCAL_USD,
  usUsd: SHIPPING_US_USD,
  overnightUsd: SHIPPING_OVERNIGHT_USD
};

export function normalizeShippingRate(value: unknown, fallback: number) {
  const amount = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(amount) || amount < 0) return fallback;
  return Math.round(amount * 100) / 100;
}

export function normalizeShippingRates(input?: Partial<ShippingRates> | null): ShippingRates {
  return {
    localUsd: normalizeShippingRate(input?.localUsd, DEFAULT_SHIPPING_RATES.localUsd),
    usUsd: normalizeShippingRate(input?.usUsd, DEFAULT_SHIPPING_RATES.usUsd),
    overnightUsd: normalizeShippingRate(input?.overnightUsd, DEFAULT_SHIPPING_RATES.overnightUsd)
  };
}

export const SHIPPING_METHODS = ["ground", "overnight"] as const;
export type ShippingMethod = (typeof SHIPPING_METHODS)[number];

export const SHIPPING_CARRIERS = ["ups", "fedex"] as const;
export type ShippingCarrier = (typeof SHIPPING_CARRIERS)[number];

export const SHIPPING_CARRIER_LABELS: Record<ShippingCarrier, string> = {
  ups: "UPS",
  fedex: "FedEx"
};

/** DFW metro prefixes: Plano, Dallas, Fort Worth, Arlington, and nearby. */
const LOCAL_ZIP_PREFIXES = ["750", "751", "752", "753", "760", "761", "762"];

export function normalizeUsZip(value: string) {
  return value.replace(/\D/g, "").slice(0, 5);
}

export function isUsZip(value: string) {
  return /^\d{5}$/.test(normalizeUsZip(value));
}

export function isLocalPlanoShippingZip(value: string) {
  const zip = normalizeUsZip(value);
  if (zip.length !== 5) return false;
  return LOCAL_ZIP_PREFIXES.includes(zip.slice(0, 3));
}

export function isShippingMethod(value: string): value is ShippingMethod {
  return (SHIPPING_METHODS as readonly string[]).includes(value);
}

export function isShippingCarrier(value: string): value is ShippingCarrier {
  return (SHIPPING_CARRIERS as readonly string[]).includes(value);
}

export function isComplimentaryShipping(percentOff: number) {
  return percentOff >= 100;
}

export type InsuranceSettings = {
  minUsd: number;
  percent: number;
  percentAboveUsd: number;
  applyAboveUsd: number;
};

export const DEFAULT_INSURANCE_SETTINGS: InsuranceSettings = {
  minUsd: 2,
  percent: 1,
  percentAboveUsd: 715,
  applyAboveUsd: 100
};

export function normalizeInsuranceSettings(input?: Partial<InsuranceSettings> | null): InsuranceSettings {
  return {
    minUsd: normalizeShippingRate(input?.minUsd, DEFAULT_INSURANCE_SETTINGS.minUsd),
    percent: normalizeShippingRate(input?.percent, DEFAULT_INSURANCE_SETTINGS.percent),
    percentAboveUsd: normalizeShippingRate(input?.percentAboveUsd, DEFAULT_INSURANCE_SETTINGS.percentAboveUsd),
    applyAboveUsd: normalizeShippingRate(input?.applyAboveUsd, DEFAULT_INSURANCE_SETTINGS.applyAboveUsd)
  };
}

export function quoteInsurance(
  declaredValueUsd: number,
  percentOff = 0,
  settings: Partial<InsuranceSettings> = DEFAULT_INSURANCE_SETTINGS
) {
  const live = normalizeInsuranceSettings(settings);
  const value = Math.max(0, Number(declaredValueUsd) || 0);

  if (isComplimentaryShipping(percentOff) || value <= live.applyAboveUsd) {
    return {
      amountUsd: 0,
      label: "Shipping insurance",
      applies: false
    };
  }

  const amountUsd =
    value > live.percentAboveUsd
      ? Math.round(((value * live.percent) / 100) * 100) / 100
      : live.minUsd;

  return {
    amountUsd,
    label: "Shipping insurance",
    applies: amountUsd > 0
  };
}

export function quoteShipping(
  zip: string,
  method: ShippingMethod,
  percentOff = 0,
  rates: Partial<ShippingRates> = DEFAULT_SHIPPING_RATES
) {
  const live = normalizeShippingRates(rates);
  const local = isLocalPlanoShippingZip(zip);
  const quoted =
    method === "overnight"
      ? {
          amountUsd: live.overnightUsd,
          zone: local ? ("local" as const) : ("us" as const),
          label: "Overnight insured shipping (US)"
        }
      : local
        ? {
            amountUsd: live.localUsd,
            zone: "local" as const,
            label: "Insured ground — Plano / DFW"
          }
        : {
            amountUsd: live.usUsd,
            zone: "us" as const,
            label: "Insured ground — rest of US"
          };

  if (!isComplimentaryShipping(percentOff)) return quoted;

  return {
    ...quoted,
    amountUsd: 0,
    label: "Free shipping"
  };
}

export function trackingUrl(carrier: string, trackingNumber: string) {
  const number = trackingNumber.trim();
  if (!number) return "";
  if (carrier === "fedex") {
    return `https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(number)}`;
  }
  return `https://www.ups.com/track?tracknum=${encodeURIComponent(number)}`;
}
