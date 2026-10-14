import type { Metadata } from "next";
import { isPlaceholderImage, listingSection, type ShopListing } from "@/lib/listing-types";
import { toDisplayImageUrl } from "@/lib/r2-display";
import { SITE_NAME, SITE_URL, absoluteUrl } from "@/lib/site";

export function brandHubSegment(brand: string) {
  return brand
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function brandHubPath(brand: string) {
  return `/listings/brand/${brandHubSegment(brand)}`;
}

export function listingCanonicalPath(slug: string) {
  return `/listings/${slug}`;
}

export function listingPageTitle(listing: Pick<ShopListing, "name" | "referenceNumber">) {
  const name = listing.name.trim();
  const ref = listing.referenceNumber?.trim() || "";
  if (!ref) return name;
  if (name.toLowerCase().includes(ref.toLowerCase())) return name;
  return `${name} Ref. ${ref}`;
}

export function listingMetaDescription(listing: ShopListing) {
  const title = listingPageTitle(listing);
  const section = listingSection(listing);
  const bits = [title];
  if (listing.year) bits.push(String(listing.year));
  if (section === "vintage") bits.push("vintage");
  if (section === "project") bits.push("project watch");
  if (listing.limitedEdition) bits.push("limited edition");
  if (listing.condition) bits.push(`${listing.condition} condition`);
  const lead = `${bits.join(" · ")}.`;
  const fromBody = listing.description
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const extra = fromBody.slice(0, 140);
  const combined = extra ? `${lead} ${extra}` : `${lead} Available at ${SITE_NAME}.`;
  return combined.length > 160 ? `${combined.slice(0, 157).trim()}…` : combined;
}

export function listingSocialImage(listing: Pick<ShopListing, "imageUrl">) {
  if (!listing.imageUrl || isPlaceholderImage(listing.imageUrl)) return undefined;
  const display = toDisplayImageUrl(listing.imageUrl);
  return absoluteUrl(display);
}

function schemaCondition(condition: string) {
  return condition === "New" ? "https://schema.org/NewCondition" : "https://schema.org/UsedCondition";
}

export function listingProductJsonLd(listing: ShopListing) {
  const url = absoluteUrl(listingCanonicalPath(listing.slug));
  const images = [listing.imageUrl, ...(listing.imageUrls || [])]
    .filter((urlValue) => urlValue && !isPlaceholderImage(urlValue))
    .map((urlValue) => absoluteUrl(toDisplayImageUrl(urlValue)));
  const uniqueImages = [...new Set(images)];

  const offer: Record<string, unknown> = {
    "@type": "Offer",
    url,
    priceCurrency: "USD",
    availability: listing.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    itemCondition: schemaCondition(listing.condition),
    seller: { "@type": "Organization", name: SITE_NAME }
  };
  if (!listing.callForPricing && listing.priceUsd > 0) {
    offer.price = listing.priceUsd;
  }

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: listingPageTitle(listing),
    description: listingMetaDescription(listing),
    sku: listing.referenceNumber || listing.slug,
    mpn: listing.referenceNumber || undefined,
    brand: { "@type": "Brand", name: listing.brand },
    image: uniqueImages.length ? uniqueImages : undefined,
    url,
    offers: offer
  };
}

export function listingBreadcrumbJsonLd(listing: ShopListing) {
  const crumbs = listingBreadcrumbs(listing);
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.label,
      item: crumb.href.startsWith("http") ? crumb.href : absoluteUrl(crumb.href)
    }))
  };
}

export function listingBreadcrumbs(listing: ShopListing) {
  const section = listingSection(listing);
  const crumbs: Array<{ label: string; href: string }> = [
    { label: "Home", href: "/" },
    { label: "Watches", href: "/listings" }
  ];
  if (section === "vintage") crumbs.push({ label: "Vintage", href: "/vintage" });
  if (section === "project") crumbs.push({ label: "Project watches", href: "/project-watches" });
  if (listing.limitedEdition) crumbs.push({ label: "Limited editions", href: "/limited-editions" });
  if (listing.brand) crumbs.push({ label: listing.brand, href: brandHubPath(listing.brand) });
  crumbs.push({ label: listingPageTitle(listing), href: listingCanonicalPath(listing.slug) });
  return crumbs;
}

export function listingSpecRows(listing: ShopListing) {
  const section = listingSection(listing);
  const rows: Array<{ label: string; value: string }> = [
    { label: "Brand", value: listing.brand },
    { label: "Reference", value: listing.referenceNumber || "—" },
    { label: "Collection", value: listing.collection || "—" },
    { label: "Year", value: listing.year ? String(listing.year) : "—" },
    { label: "Condition", value: listing.condition },
    {
      label: "Category",
      value: section === "vintage" ? "Vintage" : section === "project" ? "Project watch" : "Watch"
    }
  ];
  if (listing.limitedEdition) {
    rows.push({
      label: "Limited edition",
      value: listing.productionQuantity ? `${listing.productionQuantity} pieces` : "Yes"
    });
  }
  return rows;
}

export function listingMetadata(listing: ShopListing): Metadata {
  const title = listingPageTitle(listing);
  const description = listingMetaDescription(listing);
  const canonical = absoluteUrl(listingCanonicalPath(listing.slug));
  const image = listingSocialImage(listing);

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      type: "website",
      url: canonical,
      siteName: SITE_NAME,
      images: image ? [{ url: image, alt: title }] : undefined
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      images: image ? [image] : undefined
    }
  };
}

export function staticPageMetadata(input: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  const canonical = absoluteUrl(input.path);
  return {
    title: input.title,
    description: input.description,
    alternates: { canonical },
    openGraph: {
      title: input.title,
      description: input.description,
      type: "website",
      url: canonical,
      siteName: SITE_NAME
    },
    twitter: {
      card: "summary",
      title: input.title,
      description: input.description
    }
  };
}

export function inventoryBrands(listings: Array<Pick<ShopListing, "brand">>) {
  const seen = new Set<string>();
  const brands: string[] = [];
  for (const listing of listings) {
    const brand = listing.brand?.trim();
    if (!brand) continue;
    const key = brandHubSegment(brand);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    brands.push(brand);
  }
  return brands.sort((a, b) => a.localeCompare(b));
}

export function brandFromSegment(segment: string, listings: Array<Pick<ShopListing, "brand">>) {
  const wanted = brandHubSegment(segment);
  return inventoryBrands(listings).find((brand) => brandHubSegment(brand) === wanted) || "";
}

export { SITE_URL };
