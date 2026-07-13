import mongoose from "mongoose";

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI is required.");
  process.exit(1);
}

async function getEbayApiBase() {
  const explicit = process.env.EBAY_ENV?.toLowerCase();
  if (explicit === "sandbox" || explicit === "production") {
    return explicit === "sandbox" ? "https://api.sandbox.ebay.com" : "https://api.ebay.com";
  }
  const clientId = process.env.EBAY_CLIENT_ID ?? "";
  const clientSecret = process.env.EBAY_CLIENT_SECRET ?? "";
  if (clientId.includes("-SBX-") || clientSecret.startsWith("SBX-")) {
    return "https://api.sandbox.ebay.com";
  }
  return "https://api.ebay.com";
}

async function getEbayToken() {
  const clientId = process.env.EBAY_CLIENT_ID;
  const clientSecret = process.env.EBAY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("EBAY_CLIENT_ID and EBAY_CLIENT_SECRET are required.");
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const scope = encodeURIComponent("https://api.ebay.com/oauth/api_scope");
  const response = await fetch(`${await getEbayApiBase()}/identity/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: `grant_type=client_credentials&scope=${scope}`
  });

  if (!response.ok) {
    throw new Error(`OAuth failed: ${response.status}`);
  }

  const payload = await response.json();
  return payload.access_token;
}

async function searchEbay(token, query) {
  const url = new URL(`${await getEbayApiBase()}/buy/browse/v1/item_summary/search`);
  url.searchParams.set("q", query.keywords);
  url.searchParams.set("sort", "newlyListed");
  url.searchParams.set("limit", String(query.resultLimit ?? 50));

  const filters = [];
  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    filters.push(`price:[${query.minPrice ?? 0}..${query.maxPrice ?? 999999}]`);
    filters.push("priceCurrency:USD");
  }
  if (filters.length) url.searchParams.set("filter", filters.join(","));

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "X-EBAY-C-MARKETPLACE-ID": query.marketplaceId ?? "EBAY_US"
    }
  });

  if (!response.ok) {
    throw new Error(`Search failed for ${query.name}: ${response.status}`);
  }

  const payload = await response.json();
  return payload.itemSummaries ?? [];
}

async function main() {
  await mongoose.connect(uri);
  const queries = await mongoose.connection.collection("searchqueries").find({ enabled: true }).toArray();
  const token = await getEbayToken();

  for (const query of queries) {
    const items = await searchEbay(token, query);
    let newCount = 0;

    for (const item of items) {
      const ebayItemId = item.itemId ?? item.legacyItemId;
      if (!ebayItemId || !item.title || !item.itemWebUrl) continue;

      const existing = await mongoose.connection.collection("searchresults").findOne({
        searchQueryId: query._id,
        ebayItemId
      });

      if (!existing) {
        await mongoose.connection.collection("searchresults").insertOne({
          searchQueryId: query._id,
          queryName: query.name,
          ebayItemId,
          title: item.title,
          price: Number(item.price?.value ?? 0),
          currency: item.price?.currency ?? "USD",
          condition: item.condition ?? "Unknown",
          itemWebUrl: item.itemWebUrl,
          imageUrl: item.image?.imageUrl ?? "",
          sellerUsername: item.seller?.username ?? "",
          isUnseen: true,
          firstSeenAt: new Date(),
          lastSeenAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        });
        newCount += 1;
      } else {
        await mongoose.connection.collection("searchresults").updateOne(
          { _id: existing._id },
          {
            $set: {
              title: item.title,
              price: Number(item.price?.value ?? 0),
              currency: item.price?.currency ?? "USD",
              condition: item.condition ?? "Unknown",
              itemWebUrl: item.itemWebUrl,
              imageUrl: item.image?.imageUrl ?? "",
              sellerUsername: item.seller?.username ?? "",
              queryName: query.name,
              lastSeenAt: new Date(),
              updatedAt: new Date()
            }
          }
        );
      }
    }

    await mongoose.connection.collection("searchqueries").updateOne(
      { _id: query._id },
      { $set: { lastRunAt: new Date(), updatedAt: new Date() } }
    );

    console.log(`${query.name}: found ${items.length}, new ${newCount}`);
  }

  await mongoose.disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
