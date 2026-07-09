interface EbayTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

interface EbaySearchItem {
  itemId?: string;
  legacyItemId?: string;
  title?: string;
  price?: { value?: string; currency?: string };
  condition?: string;
  itemWebUrl?: string;
  image?: { imageUrl?: string };
  seller?: { username?: string };
}

interface EbaySearchResponse {
  itemSummaries?: EbaySearchItem[];
  total?: number;
}

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getApplicationToken() {
  const clientId = process.env.EBAY_CLIENT_ID;
  const clientSecret = process.env.EBAY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("EBAY_CLIENT_ID and EBAY_CLIENT_SECRET are required for search.");
  }

  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.value;
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const scope = encodeURIComponent("https://api.ebay.com/oauth/api_scope");
  const response = await fetch(`https://api.ebay.com/identity/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: `grant_type=client_credentials&scope=${scope}`
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`eBay OAuth failed: ${response.status} ${text}`);
  }

  const payload = (await response.json()) as EbayTokenResponse;
  cachedToken = {
    value: payload.access_token,
    expiresAt: Date.now() + payload.expires_in * 1000
  };
  return payload.access_token;
}

export interface EbaySearchParams {
  keywords: string;
  marketplaceId?: string;
  minPrice?: number;
  maxPrice?: number;
  limit?: number;
}

export interface NormalizedEbayResult {
  ebayItemId: string;
  title: string;
  price: number;
  currency: string;
  condition: string;
  itemWebUrl: string;
  imageUrl: string;
  sellerUsername: string;
}

export async function searchEbayListings(params: EbaySearchParams): Promise<NormalizedEbayResult[]> {
  const token = await getApplicationToken();
  const marketplaceId = params.marketplaceId ?? process.env.EBAY_MARKETPLACE_ID ?? "EBAY_US";
  const limit = params.limit ?? 50;

  const filters: string[] = [];
  if (params.minPrice !== undefined || params.maxPrice !== undefined) {
    const min = params.minPrice ?? 0;
    const max = params.maxPrice ?? 999999;
    filters.push(`price:[${min}..${max}]`);
  }

  const url = new URL("https://api.ebay.com/buy/browse/v1/item_summary/search");
  url.searchParams.set("q", params.keywords);
  url.searchParams.set("sort", "newlyListed");
  url.searchParams.set("limit", String(limit));
  if (filters.length > 0) {
    url.searchParams.set("filter", filters.join(","));
  }

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
      "X-EBAY-C-MARKETPLACE-ID": marketplaceId
    },
    cache: "no-store"
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`eBay search failed: ${response.status} ${text}`);
  }

  const payload = (await response.json()) as EbaySearchResponse;
  const items = payload.itemSummaries ?? [];

  return items
    .map((item) => {
      const ebayItemId = item.itemId ?? item.legacyItemId;
      if (!ebayItemId || !item.title || !item.itemWebUrl) return null;
      return {
        ebayItemId,
        title: item.title,
        price: Number(item.price?.value ?? 0),
        currency: item.price?.currency ?? "USD",
        condition: item.condition ?? "Unknown",
        itemWebUrl: item.itemWebUrl,
        imageUrl: item.image?.imageUrl ?? "",
        sellerUsername: item.seller?.username ?? ""
      };
    })
    .filter((item): item is NormalizedEbayResult => item !== null);
}
