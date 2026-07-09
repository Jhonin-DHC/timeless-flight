import Link from "next/link";
import { PortfolioCategory } from "@/data/portfolio";

interface PortfolioCardProps {
  category: PortfolioCategory;
}

export function PortfolioCard({ category }: PortfolioCardProps) {
  return (
    <article className="glass-card">
      <h3 className="text-xl font-semibold">{category.title}</h3>
      <p className="mt-2 text-sm text-[var(--muted)]">{category.description}</p>
      <Link href={`/portfolio/${category.slug}`} className="mt-4 inline-block text-sm text-[var(--brand-a)]">
        Explore category
      </Link>
    </article>
  );
}
