import { connectMongo } from "@/lib/mongodb";
import { normalizeShippingRates, type ShippingRates } from "@/lib/shipping";
import { getSetting, setSetting } from "@/models/AppSettings";

const SHIPPING_RATES_KEY = "shippingRates";

export async function getShippingRates(): Promise<ShippingRates> {
  await connectMongo();
  const stored = await getSetting<Partial<ShippingRates> | null>(SHIPPING_RATES_KEY, null);
  return normalizeShippingRates(stored);
}

export async function saveShippingRates(input: Partial<ShippingRates>): Promise<ShippingRates> {
  const rates = normalizeShippingRates({
    ...(await getShippingRates()),
    ...input
  });
  await setSetting(SHIPPING_RATES_KEY, rates);
  return rates;
}
