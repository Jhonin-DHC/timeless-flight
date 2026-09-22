import fs from "fs";
import path from "path";
import mongoose from "mongoose";

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI is required.");
  process.exit(1);
}

const PLACEHOLDER_IMAGE = "/images/watch-placeholder.svg";
const catalogPath = path.resolve(process.cwd(), "src/data/limited-editions-catalog.json");
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
    availabilityNote: { type: String, default: "" },
    limitedEdition: { type: Boolean, default: false },
    callForPricing: { type: Boolean, default: false },
    productionQuantity: { type: String, default: "" }
  },
  { timestamps: true, suppressReservedKeysWarning: true }
);

const Listing = mongoose.models.Listing || mongoose.model("Listing", ListingSchema);

async function main() {
  await mongoose.connect(uri);
  let created = 0;
  let updated = 0;

  for (const item of catalog) {
    const payload = {
      storefrontProductId: item.slug,
      slug: item.slug,
      name: item.name,
      brand: item.brand,
      referenceNumber: item.referenceNumber || "",
      collection: item.collection || "Limited Edition",
      year: item.year,
      priceUsd: item.priceUsd || 0,
      condition: item.condition,
      category: item.category || "shop",
      inStock: false,
      availabilityNote: item.availabilityNote || "",
      callForPricing: Boolean(item.callForPricing),
      limitedEdition: true,
      productionQuantity: item.productionQuantity || "",
      description: item.description,
      imageUrl: item.imageUrl || PLACEHOLDER_IMAGE,
      imageUrls: Array.isArray(item.imageUrls) ? item.imageUrls : [],
      published: true
    };

    const existing = await Listing.findOne({ slug: item.slug });
    if (existing) {
      await Listing.updateOne({ _id: existing._id }, payload);
      updated += 1;
      continue;
    }
    await Listing.create(payload);
    created += 1;
  }

  console.log(`Limited edition import complete. created=${created} updated=${updated} total=${catalog.length}`);
  await mongoose.disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
