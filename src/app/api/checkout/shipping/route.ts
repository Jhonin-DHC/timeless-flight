import { NextResponse } from "next/server";
import { isPickupMethod, isShippingMethod, isUsZip, quoteInsurance, quoteShipping } from "@/lib/shipping";
import { getInsuranceSettings, getShippingRates, getTaxSettings } from "@/lib/shipping-settings";
import { quoteWatchTax } from "@/lib/tax";

export async function GET(request: Request) {
  try {
    const rates = await getShippingRates();
    const insuranceSettings = await getInsuranceSettings();
    const taxSettings = await getTaxSettings();
    const { searchParams } = new URL(request.url);
    const zip = searchParams.get("zip") || "";
    const methodRaw = searchParams.get("method") || "ground";
    const percentOff = Number(searchParams.get("percentOff") || 0);
    const subtotal = Number(searchParams.get("subtotal") || 0);
    const discount = Number(searchParams.get("discount") || 0);
    const method = isShippingMethod(methodRaw) ? methodRaw : "ground";
    const off = Number.isFinite(percentOff) ? percentOff : 0;
    const cartSubtotal = Number.isFinite(subtotal) ? subtotal : 0;
    const merchandiseUsd = Math.max(0, cartSubtotal - (Number.isFinite(discount) ? discount : 0));
    const pickup = isPickupMethod(method);

    return NextResponse.json({
      rates,
      insuranceSettings,
      taxSettings,
      quote: pickup || isUsZip(zip) ? quoteShipping(zip, method, off, rates) : null,
      insurance: quoteInsurance(cartSubtotal, off, insuranceSettings, method),
      tax: quoteWatchTax(merchandiseUsd, taxSettings.percent)
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load shipping rates.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
