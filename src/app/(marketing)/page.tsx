import Link from "next/link";
import { ListingCard } from "@/components/listing-card";
import { PortfolioCard } from "@/components/portfolio-card";
import { TestimonialsSection } from "@/components/testimonials-section";
import { VideoPlayer } from "@/components/video-player";
import { WatchSearchForm } from "@/components/watch-search-form";
import { getPublishedListings } from "@/lib/listings-service";
import { getFeaturedVideos } from "@/lib/videos-service";
import { portfolioCategories } from "@/data/portfolio";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [listings, featuredVideos] = await Promise.all([getPublishedListings(), getFeaturedVideos(3)]);

  return (
    <div className="space-y-10 md:space-y-14">
      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(260px,0.85fr)] lg:items-stretch">
        <div className="glass-panel flex flex-col justify-center space-y-5">
          <p className="text-sm uppercase tracking-[0.2em] text-[var(--brand-c)]">The Aviators Watch</p>
          <h1 className="max-w-4xl text-4xl font-semibold leading-tight md:text-6xl">Shop branded watches</h1>
          <p className="section-copy max-w-3xl">
            Search by brand, model, or reference — including current pieces, vintage, limited editions, and project
            watches.
          </p>
          <WatchSearchForm extraBrands={listings.map((listing) => listing.brand)} />
          <div className="flex flex-wrap gap-3">
            <Link href="/listings" className="btn-gradient-primary">
              Browse all watches
            </Link>
            <Link href="/vintage" className="btn-gradient-secondary">
              Vintage
            </Link>
            <Link href="/limited-editions" className="btn-gradient-secondary">
              Limited editions
            </Link>
          </div>
        </div>

        <aside className="glass-card flex flex-col justify-between gap-4 lg:min-h-full">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--brand-c)]">Also available</p>
            <h2 className="text-xl font-semibold leading-snug md:text-2xl">Sell your unused branded watches</h2>
            <p className="text-sm leading-relaxed text-[var(--muted)]">
              Running or not, papers or not — get a free, no-obligation valuation. Sell outright or exchange toward
              another timepiece.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Link href="/sell/intake" className="btn-gradient-secondary text-center text-sm">
              Get a free valuation
            </Link>
            <Link href="/sell" className="text-center text-sm text-[var(--brand-a)]">
              We buy branded watches
            </Link>
          </div>
        </aside>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Link href="/listings" className="glass-card space-y-2">
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--brand-c)]">Catalog</p>
          <h2 className="text-xl font-semibold">All watches</h2>
          <p className="text-sm text-[var(--muted)]">
            {listings.length} pieces — filter by brand, collection, price, and availability.
          </p>
        </Link>
        <Link href="/limited-editions" className="glass-card space-y-2">
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--brand-c)]">Collector pieces</p>
          <h2 className="text-xl font-semibold">Limited editions</h2>
          <p className="text-sm text-[var(--muted)]">
            Numbered and scarce Breitlings, including Navitimer limited editions.
          </p>
        </Link>
        <Link href="/vintage" className="glass-card space-y-2">
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--brand-c)]">20+ years</p>
          <h2 className="text-xl font-semibold">Vintage watches</h2>
          <p className="text-sm text-[var(--muted)]">Older references with character, patina, and history.</p>
        </Link>
        <Link href="/project-watches" className="glass-card space-y-2">
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--brand-c)]">Needs work</p>
          <h2 className="text-xl font-semibold">Project watches</h2>
          <p className="text-sm text-[var(--muted)]">Restoration, repair, and as-is project pieces.</p>
        </Link>
      </section>

      <section className="space-y-5">
        <div className="flex items-end justify-between">
          <h2 className="section-title">Featured pieces</h2>
          <Link href="/listings" className="text-sm text-[var(--brand-a)]">
            View all watches
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {listings.slice(0, 8).map((listing) => (
            <ListingCard key={listing.id} listing={listing} compact />
          ))}
        </div>
      </section>

      {featuredVideos.length > 0 ? (
        <section className="space-y-5">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="section-title">Featured videos</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">Watch buying notes and market guides from our desk.</p>
            </div>
            <Link href="/resources/videos" className="text-sm text-[var(--brand-a)]">
              All videos
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {featuredVideos.map((video) => (
              <article key={video.id} className="space-y-3">
                <VideoPlayer
                  title={video.title}
                  videoUrl={video.videoUrl}
                  youtubeVideoId={video.youtubeVideoId}
                  className="aspect-video w-full rounded-2xl bg-black"
                />
                <div>
                  <h3 className="font-semibold">{video.title}</h3>
                  {video.description ? (
                    <p className="mt-1 line-clamp-2 text-sm text-[var(--muted)]">{video.description}</p>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="space-y-5">
        <h2 className="section-title">Portfolio categories</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {portfolioCategories.map((category) => (
            <PortfolioCard key={category.slug} category={category} />
          ))}
        </div>
      </section>

      <TestimonialsSection />
    </div>
  );
}
