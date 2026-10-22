export const SHIPPING_LOCAL_USD = 45;
export const SHIPPING_US_USD = 75;
export const SHIPPING_OVERNIGHT_USD = 175;

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

export function quoteShipping(zip: string, method: ShippingMethod) {
  const local = isLocalPlanoShippingZip(zip);
  if (method === "overnight") {
    return {
      amountUsd: SHIPPING_OVERNIGHT_USD,
      zone: local ? ("local" as const) : ("us" as const),
      label: "Overnight insured shipping (US)"
    };
  }
  if (local) {
    return {
      amountUsd: SHIPPING_LOCAL_USD,
      zone: "local" as const,
      label: "Insured ground — Plano / DFW"
    };
  }
  return {
    amountUsd: SHIPPING_US_USD,
    zone: "us" as const,
    label: "Insured ground — rest of US"
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
