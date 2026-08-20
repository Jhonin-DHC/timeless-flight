/**
 * Creates one Stripe percent-off promotion code and appends it to stripe-promo-codes.local.json.
 * Usage: node --env-file=.env.local scripts/create-stripe-promo-codes.mjs 100
 * (omit args to create the default 25/20/15/10/5 set)
 */
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import Stripe from "stripe";

const DEFAULT_PERCENTS = [25, 20, 15, 10, 5];

function makeCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(12);
  let raw = "";
  for (let i = 0; i < 12; i += 1) {
    raw += alphabet[bytes[i] % alphabet.length];
  }
  return `${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}`;
}

function parsePercents(argv) {
  const values = argv
    .slice(2)
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value) && value > 0 && value <= 100);
  return values.length > 0 ? values : DEFAULT_PERCENTS;
}

async function main() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is missing. Use --env-file=.env.local");
  }

  const percents = parsePercents(process.argv);
  const stripe = new Stripe(key);
  const created = [];

  for (const percent of percents) {
    const code = makeCode();
    const coupon = await stripe.coupons.create({
      percent_off: percent,
      duration: "forever",
      name: percent === 100 ? "Private test 100% off" : `Private ${percent}% off`,
      metadata: {
        purpose: percent === 100 ? "test_discount" : "private_discount",
        percent_off: String(percent)
      }
    });

    const promotionCode = await stripe.promotionCodes.create({
      promotion: { type: "coupon", coupon: coupon.id },
      code,
      active: true,
      metadata: {
        percent_off: String(percent),
        purpose: percent === 100 ? "test_discount" : "private_discount"
      }
    });

    created.push({
      percentOff: percent,
      code: promotionCode.code,
      couponId: coupon.id,
      promotionCodeId: promotionCode.id
    });

    console.log(`${percent}% → ${promotionCode.code}`);
  }

  const outPath = resolve(process.cwd(), "stripe-promo-codes.local.json");
  let existing = { createdAt: new Date().toISOString(), mode: key.startsWith("sk_live_") ? "live" : "test", codes: [] };
  if (existsSync(outPath)) {
    try {
      existing = JSON.parse(readFileSync(outPath, "utf8"));
      if (!Array.isArray(existing.codes)) existing.codes = [];
    } catch {
      // rewrite file if corrupt
    }
  }

  const merged = {
    ...existing,
    updatedAt: new Date().toISOString(),
    mode: key.startsWith("sk_live_") ? "live" : "test",
    codes: [...existing.codes, ...created]
  };

  writeFileSync(outPath, JSON.stringify(merged, null, 2), "utf8");
  console.log(`\nSaved to ${outPath} (do not commit).`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
