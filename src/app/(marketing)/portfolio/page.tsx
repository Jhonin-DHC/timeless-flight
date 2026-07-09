import Link from "next/link";
import { portfolioCategories } from "@/data/portfolio";

export default function PortfolioIndexPage() {
  return (
    <section className="space-y-6">
      <h1 className="section-title">Portfolio Categories</h1>
      <div className="grid gap-4 md:grid-cols-3">
        {portfolioCategories.map((category) => (
          <Link key={category.slug} href={`/portfolio/${category.slug}`} className="glass-card hover:border-[var(--brand-a)]">
            <h2 className="text-xl font-semibold">{category.title}</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">{category.description}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
