import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI is required.");
  process.exit(1);
}

const listings = [
  {
    storefrontProductId: "rolex-submariner-date-126610ln",
    slug: "rolex-submariner-date-126610ln",
    name: "Rolex Submariner Date 126610LN",
    brand: "Rolex",
    condition: "Excellent",
    year: 2023,
    priceUsd: 14250,
    imageUrl: "https://images.unsplash.com/photo-1524592094714-0f0654e20314",
    imageUrls: [],
    description: "Ceramic bezel diver with full set and sharp case lines.",
    published: true
  }
];

const searchQueries = [
  {
    name: "Rolex Steel Sports",
    keywords: "Rolex Submariner 126610LN GMT-Master II Pepsi Batgirl",
    marketplaceId: "EBAY_US",
    resultLimit: 50,
    enabled: true
  },
  {
    name: "Tudor Black Bay Series",
    keywords: "Tudor Black Bay BB58 BB54 BB58 GMT",
    marketplaceId: "EBAY_US",
    resultLimit: 50,
    enabled: true
  },
  {
    name: "Omega Speedmaster Professional",
    keywords: "Omega Speedmaster Professional Hesalite Sapphire Moonwatch",
    marketplaceId: "EBAY_US",
    resultLimit: 50,
    enabled: true
  },
  {
    name: "Omega Seamaster Professional 300M",
    keywords: "Omega Seamaster Professional 300M Hesalite Sapphire",
    marketplaceId: "EBAY_US",
    resultLimit: 50,
    enabled: true
  },
  {
    name: 'Seiko 6139 "Pogue"',
    keywords: "Seiko 6139 Pogue",
    marketplaceId: "EBAY_US",
    resultLimit: 50,
    enabled: true
  },
  {
    name: 'Seiko 6105 "Captain Willard"',
    keywords: "Seiko 6105 Captain Willard",
    marketplaceId: "EBAY_US",
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
