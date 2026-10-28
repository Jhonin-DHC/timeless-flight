import { connectMongo } from "@/lib/mongodb";
import {
  normalizeInsuranceSettings,
  normalizeShippingRates,
  type InsuranceSettings,
  type ShippingRates
} from "@/lib/shipping";
import { getSetting, setSetting } from "@/models/AppSettings";

const SHIPPING_RATES_KEY = "shippingRates";
const INSURANCE_SETTINGS_KEY = "insuranceSettings";

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

export async function getInsuranceSettings(): Promise<InsuranceSettings> {
  await connectMongo();
  const stored = await getSetting<Partial<InsuranceSettings> | null>(INSURANCE_SETTINGS_KEY, null);
  return normalizeInsuranceSettings(stored);
}

export async function saveInsuranceSettings(input: Partial<InsuranceSettings>): Promise<InsuranceSettings> {
  const settings = normalizeInsuranceSettings({
    ...(await getInsuranceSettings()),
    ...input
  });
  await setSetting(INSURANCE_SETTINGS_KEY, settings);
  return settings;
}
