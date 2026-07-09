import Link from "next/link";
import { ListingCard } from "@/components/listing-card";
import { PortfolioCard } from "@/components/portfolio-card";
import { getPublishedListings } from "@/lib/listings-service";
import { portfolioCategories } from "@/data/portfolio";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const listings = await getPublishedListings();

  return (
    <div className="space-y-10 md:space-y-14">
      <section className="glass-panel">
        <p className="text-sm uppercase tracking-[0.2em] text-[var(--brand-c)]">Timeless Flight</p>
        <h1 className="mt-3 text-4xl font-semibold leading-tight md:text-6xl">Curated watches built to outlast trends.</h1>
        <p className="section-copy mt-5 max-w-2xl">
          Browse collector-grade timepieces with transparent details, rich media, and a clean path to your future GHL-powered checkout.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/listings" className="btn-gradient-primary">Shop listings</Link>
          <Link href="/about" className="btn-gradient-secondary">About Timeless Flight</Link>
        </div>
      </section>

      <section className="space-y-5">
        <div className="flex items-end justify-between">
          <h2 className="section-title">Featured pieces</h2>
          <Link href="/listings" className="text-sm text-[var(--brand-a)]">View all listings</Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {listings.slice(0, 3).map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      </section>

      <section className="space-y-5">
        <h2 className="section-title">Portfolio categories</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {portfolioCategories.map((category) => (
            <PortfolioCard key={category.slug} category={category} />
          ))}
        </div>
      </section>
    </div>
  );
}
