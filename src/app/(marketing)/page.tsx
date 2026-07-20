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
      <section className="glass-panel space-y-5">
        <p className="text-sm uppercase tracking-[0.2em] text-[var(--brand-c)]">The Aviators Watch</p>
        <h1 className="max-w-4xl text-4xl font-semibold leading-tight md:text-6xl">
          Turn Your Unused Watches Into Cash Today
        </h1>
        <p className="max-w-3xl text-lg font-medium text-[var(--foreground)] md:text-xl">
          Running or not running, with or without papers — we&apos;ll take them all.
        </p>
        <p className="section-copy max-w-3xl">
          Complete our{" "}
          <Link href="/sell/intake" className="font-semibold text-[var(--brand-a)]">
            Watch Intake Form
          </Link>{" "}
          in just a few minutes to get started with your{" "}
          <span className="font-semibold text-[var(--foreground)]">free, no-obligation valuation.</span>
        </p>
        <p className="section-copy max-w-3xl">
          Whether you want to{" "}
          <span className="font-semibold text-[var(--foreground)]">sell outright</span> or{" "}
          <span className="font-semibold text-[var(--foreground)]">exchange for another timepiece</span>, we
          make the process simple, smart, and stress-free.
        </p>
        <div className="mt-2 flex flex-wrap gap-3">
          <Link href="/sell/intake" className="btn-gradient-primary">
            Start Watch Intake Form
          </Link>
          <Link href="/sell" className="btn-gradient-secondary">
            Learn more — We Buy Watches
          </Link>
          <Link href="/listings" className="btn-gradient-secondary">
            Shop listings
          </Link>
        </div>
      </section>

      <section className="space-y-5">
        <div className="flex items-end justify-between">
          <h2 className="section-title">Featured pieces</h2>
          <Link href="/listings" className="text-sm text-[var(--brand-a)]">
            View all listings
          </Link>
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
