import fs from "fs";
import path from "path";
import mongoose from "mongoose";

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI is required.");
  process.exit(1);
}

const PLACEHOLDER_IMAGE = "/images/watch-placeholder.svg";
const catalogPath = path.resolve(process.cwd(), "src/data/breitling-catalog.json");
const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));

const ListingSchema = new mongoose.Schema(
  {
    storefrontProductId: String,
    slug: { type: String, unique: true },
    name: String,
    brand: String,
    referenceNumber: { type: String, default: "" },
    collection: { type: String, default: "" },
    condition: String,
    year: Number,
    priceUsd: Number,
    imageUrl: String,
    imageUrls: { type: [String], default: [] },
    description: String,
    published: { type: Boolean, default: true },
    category: { type: String, default: "shop" },
    inStock: { type: Boolean, default: true },
    availabilityNote: { type: String, default: "" }
  },
  { timestamps: true }
);

const Listing = mongoose.models.Listing || mongoose.model("Listing", ListingSchema);

async function main() {
  await mongoose.connect(uri);
  let created = 0;
  let skipped = 0;

  for (const item of catalog) {
    const existing = await Listing.findOne({ slug: item.slug });
    if (existing) {
      skipped += 1;
      continue;
    }
    await Listing.create({
      ...item,
      storefrontProductId: item.slug,
      imageUrl: PLACEHOLDER_IMAGE,
      imageUrls: [],
      published: true
    });
    created += 1;
  }

  console.log(`Catalog import complete. created=${created} skipped=${skipped} total=${catalog.length}`);
  await mongoose.disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
