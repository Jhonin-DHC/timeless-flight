import { NextResponse } from "next/server";
import { isShippingMethod, isUsZip, quoteShipping } from "@/lib/shipping";
import { getShippingRates } from "@/lib/shipping-settings";

export async function GET(request: Request) {
  try {
    const rates = await getShippingRates();
    const { searchParams } = new URL(request.url);
    const zip = searchParams.get("zip") || "";
    const methodRaw = searchParams.get("method") || "ground";
    const percentOff = Number(searchParams.get("percentOff") || 0);
    const method = isShippingMethod(methodRaw) ? methodRaw : "ground";

    return NextResponse.json({
      rates,
      quote: isUsZip(zip) ? quoteShipping(zip, method, Number.isFinite(percentOff) ? percentOff : 0, rates) : null
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load shipping rates.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
