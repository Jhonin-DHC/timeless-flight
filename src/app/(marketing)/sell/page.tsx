import Link from "next/link";

const wePurchase = [
  "Luxury watches",
  "Vintage watches",
  "Modern watches",
  "Swiss watches",
  "Japanese watches",
  "Pocket watches",
  "Military watches",
  "Pilot watches",
  "Dress watches",
  "Dive watches",
  "Chronographs",
  "Quartz and mechanical watches",
  "Watch collections",
  "Estate collections",
  "Inherited watches"
];

const anyCondition = [
  "Running",
  "Not running",
  "Needing repair",
  "Missing parts",
  "Scratched or worn",
  "Vintage restoration projects",
  "Complete or watch only",
  "Box and papers or watch only"
];

const whySell = [
  "Fair market offers",
  "Fast responses",
  "Simple, hassle-free transactions",
  "Secure payment",
  "Professional and courteous service",
  "No obligation to sell"
];

export default function SellLandingPage() {
  return (
    <div className="space-y-10 md:space-y-14">
      <section className="glass-panel space-y-6">
        <p className="text-sm uppercase tracking-[0.2em] text-[var(--brand-c)]">Sell Your Watch</p>
        <h1 className="section-title max-w-4xl">Turn Your Unused Watches Into Cash Today</h1>
        <p className="text-xl font-medium text-[var(--foreground)] md:text-2xl">
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
        <p className="text-lg font-medium text-[var(--foreground)]">
          We Buy Watches — Any Brand. Any Condition. Any Collection Size.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/sell/intake" className="btn-gradient-primary">
            Start Watch Intake Form
          </Link>
          <Link href="/listings" className="btn-gradient-secondary">
            Browse current listings
          </Link>
        </div>
      </section>

      <section className="glass-panel space-y-4">
        <h2 className="section-title">Have a watch you&apos;re thinking about selling?</h2>
        <p className="section-copy max-w-3xl">
          Whether it&apos;s a single family heirloom, a luxury timepiece, a vintage find, or an entire watch
          collection, we&apos;d love the opportunity to make you a fair offer.
        </p>
      </section>

      <section className="space-y-5">
        <h2 className="section-title">We purchase</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {wePurchase.map((item) => (
            <div key={item} className="glass-card text-sm">
              {item}
            </div>
          ))}
        </div>
      </section>

      <section className="glass-panel space-y-5">
        <h2 className="section-title">We buy watches in any condition, including</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {anyCondition.map((item) => (
            <p key={item} className="text-sm text-[var(--muted)]">
              • {item}
            </p>
          ))}
        </div>
      </section>

      <section className="space-y-5">
        <h2 className="section-title">Why Sell to Us?</h2>
        <p className="section-copy max-w-3xl">
          We are watch enthusiasts who appreciate fine timepieces and treat every watch with respect. We offer:
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {whySell.map((item) => (
            <div key={item} className="glass-card text-sm">
              {item}
            </div>
          ))}
        </div>
        <div className="space-y-4 section-copy max-w-3xl">
          <p>Whether your watch is worth $50 or $50,000, we&apos;ll gladly take a look.</p>
          <p>
            If you have multiple watches, collections, or estate pieces, we&apos;re especially interested.
          </p>
          <p>
            Simply complete our{" "}
            <Link href="/sell/intake" className="text-[var(--brand-a)]">
              Watch Intake Form
            </Link>
            , upload a few photos, and we&apos;ll review your watch and contact you with an offer.
          </p>
          <p className="text-[var(--foreground)]">
            Every watch has a story. We&apos;d love to help write its next chapter.
          </p>
        </div>
        <Link href="/sell/intake" className="btn-gradient-primary inline-flex">
          Complete the Watch Intake Form
        </Link>
      </section>
    </div>
  );
}
