import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI is required.");
  process.exit(1);
}

const listings = [
  {
    storefrontProductId: "ghl_prod_rolex_submariner_126610ln",
    slug: "rolex-submariner-date-126610ln",
    name: "Rolex Submariner Date 126610LN",
    brand: "Rolex",
    condition: "Excellent",
    year: 2023,
    priceUsd: 14250,
    imageUrl: "https://images.unsplash.com/photo-1524592094714-0f0654e20314",
    description: "Ceramic bezel diver with full set and sharp case lines.",
    published: true
  }
];

const searchQueries = [
  {
    name: "Rolex Steel Sports",
    keywords: 'Rolex Submariner 126610LN GMT-Master II Pepsi Batgirl steel',
    marketplaceId: "EBAY_US",
    minPrice: 5000,
    maxPrice: 30000,
    resultLimit: 50,
    enabled: true
  }
];

async function main() {
  await mongoose.connect(uri);

  const listingCount = await mongoose.connection.collection("listings").countDocuments();
  if (listingCount === 0) {
    await mongoose.connection.collection("listings").insertMany(
      listings.map((item) => ({ ...item, createdAt: new Date(), updatedAt: new Date() }))
    );
    console.log(`Seeded ${listings.length} listings.`);
  } else {
    console.log("Listings already exist, skipping listing seed.");
  }

  const queryCount = await mongoose.connection.collection("searchqueries").countDocuments();
  if (queryCount === 0) {
    await mongoose.connection.collection("searchqueries").insertMany(
      searchQueries.map((item) => ({ ...item, createdAt: new Date(), updatedAt: new Date() }))
    );
    console.log(`Seeded ${searchQueries.length} search queries.`);
  } else {
    console.log("Search queries already exist, skipping query seed.");
  }

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (adminEmail && adminPassword) {
    const existing = await mongoose.connection.collection("adminusers").findOne({ email: adminEmail.toLowerCase() });
    if (!existing) {
      const passwordHash = await bcrypt.hash(adminPassword, 12);
      await mongoose.connection.collection("adminusers").insertOne({
        email: adminEmail.toLowerCase(),
        passwordHash,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log("Seeded admin user.");
    }
  }

  await mongoose.disconnect();
  console.log("Seed complete.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
