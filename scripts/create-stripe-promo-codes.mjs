/**
 * Creates Stripe percent-off coupons + hard-to-guess promotion codes.
 * Usage: node --env-file=.env.local scripts/create-stripe-promo-codes.mjs
 *
 * Writes codes to stripe-promo-codes.local.json (gitignored). Keep that file private.
 */
import { randomBytes } from "node:crypto";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import Stripe from "stripe";

const PERCENTS = [25, 20, 15, 10, 5];

function makeCode() {
  // Avoid ambiguous characters: 0/O, 1/I/L
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(12);
  let raw = "";
  for (let i = 0; i < 12; i += 1) {
    raw += alphabet[bytes[i] % alphabet.length];
  }
  return `${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}`;
}

async function main() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is missing. Use --env-file=.env.local");
  }

  const stripe = new Stripe(key);
  const created = [];

  for (const percent of PERCENTS) {
    const code = makeCode();
    const coupon = await stripe.coupons.create({
      percent_off: percent,
      duration: "forever",
      name: `Private ${percent}% off`,
      metadata: {
        purpose: "private_discount",
        percent_off: String(percent)
      }
    });

    const promotionCode = await stripe.promotionCodes.create({
      promotion: { type: "coupon", coupon: coupon.id },
      code,
      active: true,
      metadata: {
        percent_off: String(percent),
        purpose: "private_discount"
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
  writeFileSync(
    outPath,
    JSON.stringify(
      {
        createdAt: new Date().toISOString(),
        mode: key.startsWith("sk_live_") ? "live" : "test",
        codes: created
      },
      null,
      2
    ),
    "utf8"
  );

  console.log(`\nSaved to ${outPath} (do not commit).`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
