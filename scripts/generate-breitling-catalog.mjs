import fs from "fs";
import XLSX from "xlsx";

const wb = XLSX.readFile("public/public/Watch DATABASE.xlsx");
const rows = XLSX.utils.sheet_to_json(wb.Sheets.BREITLING, { defval: "" });

function slugify(value) {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function collectionOf(model) {
  const m = model.toLowerCase();
  if (m.includes("navitimer")) return "Navitimer";
  if (m.includes("chronomat")) return "Chronomat";
  if (m.includes("superocean") || m.includes("super ocean")) return "Superocean";
  if (m.includes("avenger")) return "Avenger";
  if (m.includes("premier")) return "Premier";
  if (m.includes("top time")) return "Top Time";
  if (m.includes("emergency")) return "Emergency";
  if (m.includes("colt")) return "Colt";
  if (m.includes("endurance")) return "Endurance Pro";
  if (m.includes("aviator") || m.includes("classic avi") || m.includes("super avi")) return "AVI";
  if (m.includes("bentley")) return "Bentley";
  return "Other";
}

function inferYear(model) {
  const range = model.match(/(19|20)\d{2}\s*-\s*(?:19|20)?\d{2}/);
  if (range) return Number(range[0].slice(0, 4));
  const paren = model.match(/\((19|20)\d{2}\)/);
  if (paren) return Number(paren[0].slice(1, 5));
  const plain = model.match(/\b((?:19|20)\d{2})\b/);
  if (plain) return Number(plain[1]);
  if (/old navitimer/i.test(model)) return 1995;
  if (/50th anniversary/i.test(model)) return 2002;
  if (/chronomat evolution/i.test(model)) return 2005;
  return 0;
}

const items = [];
for (const row of rows) {
  const model = String(row.MODEL || "").trim();
  if (!model) continue;
  const reference = String(row["REFERENCE NUMBER"] || "")
    .replace(/^Ref\.?\s*/i, "")
    .trim();
  const price = Math.round(
    Number(row["WatchCharts pre-owned price estimate"] || row["LAST SOLD PRICE"] || row["Price from authorized dealer"] || 0)
  );
  const year = inferYear(model);
  const vintage = year > 0 && year <= 2006;
  const slug = slugify(["breitling", model.replace(/^Breitling\s+/i, ""), reference].filter(Boolean).join(" "));
  const name = model.startsWith("Breitling") ? model : `Breitling ${model}`;
  items.push({
    slug,
    name,
    brand: "Breitling",
    referenceNumber: reference,
    collection: collectionOf(model),
    year: year || 2020,
    priceUsd: price || 0,
    condition: vintage ? "Very Good" : "Excellent",
    category: vintage ? "vintage" : "shop",
    inStock: false,
    availabilityNote: "Not in Stock — Estimated Delivery 3–4 Weeks",
    description: `${name} (Ref. ${reference}). Listed from our Breitling catalog. Not currently in stock; estimated delivery 3–4 weeks.`
  });
}

const header = `export const OUT_OF_STOCK_NOTE = "Not in Stock — Estimated Delivery 3–4 Weeks";

export interface CatalogSeedListing {
  slug: string;
  name: string;
  brand: string;
  referenceNumber: string;
  collection: string;
  year: number;
  priceUsd: number;
  condition: "New" | "Excellent" | "Very Good" | "Good" | "Fair";
  category: "shop" | "vintage" | "project";
  inStock: boolean;
  availabilityNote: string;
  description: string;
}

export const breitlingCatalog: CatalogSeedListing[] = `;

fs.writeFileSync("src/data/breitling-catalog.ts", `${header}${JSON.stringify(items, null, 2)};\n`);
fs.writeFileSync("src/data/breitling-catalog.json", JSON.stringify(items, null, 2));
console.log("wrote", items.length, "vintage", items.filter((item) => item.category === "vintage").length);
