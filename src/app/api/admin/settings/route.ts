import { NextResponse } from "next/server";
import { getEbayConfigStatus } from "@/lib/ebay";
import { getTeamNotifyEmails, isEmailConfigured } from "@/lib/email";
import { connectMongo } from "@/lib/mongodb";
import { isR2Configured } from "@/lib/r2";
import { normalizeInsuranceSettings, normalizeShippingRate } from "@/lib/shipping";
import {
  getInsuranceSettings,
  getShippingRates,
  saveInsuranceSettings,
  saveShippingRates
} from "@/lib/shipping-settings";
import { getSetting, setSetting } from "@/models/AppSettings";

export async function GET() {
  try {
    await connectMongo();
    const marketplaceId = await getSetting("marketplaceId", process.env.EBAY_MARKETPLACE_ID ?? "EBAY_US");
    const searchRunsPerDay = await getSetting("searchRunsPerDay", 3);
    const shippingRates = await getShippingRates();
    const insurance = await getInsuranceSettings();
    const ebay = getEbayConfigStatus();
    return NextResponse.json({
      settings: {
        marketplaceId,
        searchRunsPerDay,
        shippingLocalUsd: shippingRates.localUsd,
        shippingUsUsd: shippingRates.usUsd,
        shippingOvernightUsd: shippingRates.overnightUsd,
        insuranceMinUsd: insurance.minUsd,
        insurancePercent: insurance.percent,
        insurancePercentAboveUsd: insurance.percentAboveUsd,
        insuranceApplyAboveUsd: insurance.applyAboveUsd,
        ebayConfigured: ebay.configured,
        ebayEnv: ebay.env,
        mongoConfigured: Boolean(process.env.MONGODB_URI),
        r2Configured: isR2Configured(),
        emailConfigured: isEmailConfigured(),
        sellNotifyEmails: getTeamNotifyEmails()
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load settings.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    await connectMongo();
    const body = await request.json();
    if (body.marketplaceId) await setSetting("marketplaceId", body.marketplaceId);
    if (typeof body.searchRunsPerDay === "number") await setSetting("searchRunsPerDay", body.searchRunsPerDay);
    if (
      body.shippingLocalUsd !== undefined ||
      body.shippingUsUsd !== undefined ||
      body.shippingOvernightUsd !== undefined
    ) {
      const current = await getShippingRates();
      await saveShippingRates({
        localUsd: normalizeShippingRate(body.shippingLocalUsd, current.localUsd),
        usUsd: normalizeShippingRate(body.shippingUsUsd, current.usUsd),
        overnightUsd: normalizeShippingRate(body.shippingOvernightUsd, current.overnightUsd)
      });
    }
    if (
      body.insuranceMinUsd !== undefined ||
      body.insurancePercent !== undefined ||
      body.insurancePercentAboveUsd !== undefined ||
      body.insuranceApplyAboveUsd !== undefined
    ) {
      const current = await getInsuranceSettings();
      await saveInsuranceSettings(
        normalizeInsuranceSettings({
          minUsd: normalizeShippingRate(body.insuranceMinUsd, current.minUsd),
          percent: normalizeShippingRate(body.insurancePercent, current.percent),
          percentAboveUsd: normalizeShippingRate(body.insurancePercentAboveUsd, current.percentAboveUsd),
          applyAboveUsd: normalizeShippingRate(body.insuranceApplyAboveUsd, current.applyAboveUsd)
        })
      );
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save settings.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
