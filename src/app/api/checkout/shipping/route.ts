import { NextResponse } from "next/server";
import { isShippingMethod, isUsZip, quoteInsurance, quoteShipping } from "@/lib/shipping";
import { getInsuranceSettings, getShippingRates } from "@/lib/shipping-settings";

export async function GET(request: Request) {
  try {
    const rates = await getShippingRates();
    const insuranceSettings = await getInsuranceSettings();
    const { searchParams } = new URL(request.url);
    const zip = searchParams.get("zip") || "";
    const methodRaw = searchParams.get("method") || "ground";
    const percentOff = Number(searchParams.get("percentOff") || 0);
    const subtotal = Number(searchParams.get("subtotal") || 0);
    const method = isShippingMethod(methodRaw) ? methodRaw : "ground";
    const off = Number.isFinite(percentOff) ? percentOff : 0;

    return NextResponse.json({
      rates,
      insuranceSettings,
      quote: isUsZip(zip) ? quoteShipping(zip, method, off, rates) : null,
      insurance: Number.isFinite(subtotal) ? quoteInsurance(subtotal, off, insuranceSettings) : null
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load shipping rates.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
