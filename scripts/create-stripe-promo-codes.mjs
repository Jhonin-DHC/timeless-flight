/**
 * Creates Stripe percent-off promotion codes as AVIATOR{percent}{4 letters}.
 * Usage:
 *   node --env-file=.env.local scripts/create-stripe-promo-codes.mjs
 *   node --env-file=.env.local scripts/create-stripe-promo-codes.mjs 100
 *   node --env-file=.env.local scripts/create-stripe-promo-codes.mjs --replace 25 20 15 10 5 100
 *
 * --replace deactivates previously saved promotion codes in stripe-promo-codes.local.json
 */
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import Stripe from "stripe";

const DEFAULT_PERCENTS = [25, 20, 15, 10, 5];
const LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ";

function makeAviatorCode(percent) {
  const bytes = randomBytes(4);
  let suffix = "";
  for (let i = 0; i < 4; i += 1) {
    suffix += LETTERS[bytes[i] % LETTERS.length];
  }
  return `AVIATOR${percent}${suffix}`;
}

function parseArgs(argv) {
  const args = argv.slice(2);
  const replace = args.includes("--replace");
  const values = args
    .filter((value) => value !== "--replace")
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value) && value > 0 && value <= 100);
  return {
    replace,
    percents: values.length > 0 ? values : DEFAULT_PERCENTS
  };
}

async function main() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is missing. Use --env-file=.env.local");
  }

  const { replace, percents } = parseArgs(process.argv);
  const stripe = new Stripe(key);
  const outPath = resolve(process.cwd(), "stripe-promo-codes.local.json");

  let existing = {
    createdAt: new Date().toISOString(),
    mode: key.startsWith("sk_live_") ? "live" : "test",
    codes: []
  };
  if (existsSync(outPath)) {
    try {
      existing = JSON.parse(readFileSync(outPath, "utf8"));
      if (!Array.isArray(existing.codes)) existing.codes = [];
    } catch {
      // rewrite if corrupt
    }
  }

  const deactivated = [];
  if (replace && existing.codes.length > 0) {
    for (const entry of existing.codes) {
      if (!entry.promotionCodeId) continue;
      try {
        await stripe.promotionCodes.update(entry.promotionCodeId, { active: false });
        deactivated.push({ ...entry, active: false });
        console.log(`Deactivated ${entry.code}`);
      } catch (error) {
        console.warn(`Could not deactivate ${entry.code}:`, error instanceof Error ? error.message : error);
      }
    }
  }

  const created = [];
  for (const percent of percents) {
    const code = makeAviatorCode(percent);
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
      promotionCodeId: promotionCode.id,
      active: true
    });

    console.log(`${percent}% → ${promotionCode.code}`);
  }

  const payload = {
    createdAt: existing.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    mode: key.startsWith("sk_live_") ? "live" : "test",
    codes: replace ? created : [...existing.codes, ...created],
    deactivated: replace ? [...(existing.deactivated || []), ...deactivated] : existing.deactivated || []
  };

  writeFileSync(outPath, JSON.stringify(payload, null, 2), "utf8");
  console.log(`\nSaved to ${outPath} (do not commit).`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
