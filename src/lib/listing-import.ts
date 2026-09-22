import { breitlingCatalog } from "@/data/breitling-catalog";
import { LISTING_CATEGORIES, LISTING_CONDITIONS, PLACEHOLDER_IMAGE, type ListingCategory, type ListingCondition } from "@/lib/listing-types";
import { Listing } from "@/models/Listing";
import * as XLSX from "xlsx";

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function pick(row: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const match = Object.keys(row).find((header) => header.trim().toLowerCase() === key.toLowerCase());
    if (!match) continue;
    const value = row[match];
    if (value == null || value === "") continue;
    return String(value).trim();
  }
  return "";
}

function num(value: string) {
  const n = Number(String(value).replace(/[$,]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function bool(value: string, fallback = true) {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return fallback;
  return ["1", "true", "yes", "y", "in stock", "instock"].includes(normalized);
}

function asCategory(value: string): ListingCategory {
  const normalized = value.trim().toLowerCase();
  if (LISTING_CATEGORIES.includes(normalized as ListingCategory)) return normalized as ListingCategory;
  if (normalized.includes("project")) return "project";
  if (normalized.includes("vintage")) return "vintage";
  return "shop";
}

function asCondition(value: string): ListingCondition {
  const match = LISTING_CONDITIONS.find((item) => item.toLowerCase() === value.trim().toLowerCase());
  return match ?? "Excellent";
}

export interface ImportListingRow {
  slug: string;
  name: string;
  brand: string;
  referenceNumber: string;
  collection: string;
  year: number;
  priceUsd: number;
  condition: ListingCondition;
  category: ListingCategory;
  inStock: boolean;
  availabilityNote: string;
  description: string;
  imageUrl: string;
  published: boolean;
}

export function rowFromFlexibleRecord(row: Record<string, unknown>): ImportListingRow | null {
  const name =
    pick(row, ["name", "model", "title", "watch"]) ||
    "";
  if (!name) return null;
  const brand = pick(row, ["brand"]) || "Breitling";
  const referenceNumber = pick(row, ["referencenumber", "reference number", "reference", "ref"]).replace(/^ref\.?\s*/i, "");
  const slug =
    pick(row, ["slug"]) ||
    slugify([brand, name.replace(new RegExp(`^${brand}\\s+`, "i"), ""), referenceNumber].filter(Boolean).join(" "));
  const year = num(pick(row, ["year"])) || new Date().getFullYear();
  const priceUsd = num(
    pick(row, [
      "priceusd",
      "price",
      "watchcharts pre-owned price estimate",
      "last sold price",
      "price from authorized dealer"
    ])
  );
  const inStock = bool(pick(row, ["instock", "in stock", "stock"]), false);
  const category = asCategory(pick(row, ["category", "section"]));

  return {
    slug,
    name,
    brand,
    referenceNumber,
    collection: pick(row, ["collection"]),
    year,
    priceUsd,
    condition: asCondition(pick(row, ["condition"])),
    category,
    inStock,
    availabilityNote:
      pick(row, ["availabilitynote", "availability note", "stock note"]) ||
      (inStock ? "" : "Not in Stock — Estimated Delivery 3–4 Weeks"),
    description:
      pick(row, ["description", "notes"]) ||
      `${name}${referenceNumber ? ` (Ref. ${referenceNumber})` : ""}.`,
    imageUrl: pick(row, ["imageurl", "image url", "image"]) || PLACEHOLDER_IMAGE,
    published: bool(pick(row, ["published"]), true)
  };
}

export function parseListingWorkbook(buffer: ArrayBuffer | Buffer) {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames.find((name) => /breitling/i.test(name)) ?? workbook.SheetNames[0];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[sheetName], { defval: "" });
  return rows.map(rowFromFlexibleRecord).filter((row): row is ImportListingRow => Boolean(row));
}

export async function upsertImportedListings(rows: ImportListingRow[]) {
  let created = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const row of rows) {
    try {
      const existing = await Listing.findOne({ slug: row.slug });
      if (existing) {
        skipped += 1;
        continue;
      }
      await Listing.create({
        storefrontProductId: row.slug,
        slug: row.slug,
        name: row.name,
        brand: row.brand,
        referenceNumber: row.referenceNumber,
        collection: row.collection,
        year: row.year,
        priceUsd: row.priceUsd,
        condition: row.condition,
        category: row.category,
        inStock: row.inStock,
        availabilityNote: row.availabilityNote,
        description: row.description,
        imageUrl: row.imageUrl || PLACEHOLDER_IMAGE,
        imageUrls: [],
        published: row.published
      });
      created += 1;
    } catch (error) {
      errors.push(`${row.slug}: ${error instanceof Error ? error.message : "Failed"}`);
    }
  }

  return { created, skipped, errors, total: rows.length };
}

export function catalogRowsFromSeed() {
  return breitlingCatalog.map((item) => ({
    ...item,
    imageUrl: PLACEHOLDER_IMAGE,
    published: true
  })) satisfies ImportListingRow[];
}
