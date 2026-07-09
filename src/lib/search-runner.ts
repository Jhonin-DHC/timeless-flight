import { connectMongo } from "@/lib/mongodb";
import { searchEbayListings } from "@/lib/ebay";
import { SearchQuery } from "@/models/SearchQuery";
import { SearchResult } from "@/models/SearchResult";

export async function runAllEnabledSearches() {
  await connectMongo();
  const queries = await SearchQuery.find({ enabled: true }).sort({ name: 1 });
  const summary = [];

  for (const query of queries) {
    const result = await runSingleSearch(query._id.toString());
    summary.push(result);
  }

  return summary;
}

export async function runSingleSearch(queryId: string) {
  await connectMongo();
  const query = await SearchQuery.findById(queryId);
  if (!query) {
    throw new Error("Search query not found.");
  }

  const found = await searchEbayListings({
    keywords: query.keywords,
    marketplaceId: query.marketplaceId,
    minPrice: query.minPrice,
    maxPrice: query.maxPrice,
    limit: query.resultLimit
  });

  let newCount = 0;
  let updatedCount = 0;

  for (const item of found) {
    const existing = await SearchResult.findOne({
      searchQueryId: query._id,
      ebayItemId: item.ebayItemId
    });

    if (!existing) {
      await SearchResult.create({
        searchQueryId: query._id,
        queryName: query.name,
        ...item,
        isUnseen: true,
        firstSeenAt: new Date(),
        lastSeenAt: new Date()
      });
      newCount += 1;
      continue;
    }

    const priceChanged = existing.price !== item.price;
    await SearchResult.updateOne(
      { _id: existing._id },
      {
        $set: {
          title: item.title,
          price: item.price,
          currency: item.currency,
          condition: item.condition,
          itemWebUrl: item.itemWebUrl,
          imageUrl: item.imageUrl,
          sellerUsername: item.sellerUsername,
          queryName: query.name,
          lastSeenAt: new Date(),
          isUnseen: priceChanged ? true : existing.isUnseen
        }
      }
    );
    updatedCount += 1;
  }

  query.lastRunAt = new Date();
  await query.save();

  return {
    queryId: query._id.toString(),
    queryName: query.name,
    found: found.length,
    newCount,
    updatedCount
  };
}
