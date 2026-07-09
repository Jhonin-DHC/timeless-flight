import { notFound } from "next/navigation";
import { portfolioCategories } from "@/data/portfolio";

interface CategoryPageProps {
  params: Promise<{ category: string }>;
}

export function generateStaticParams() {
  return portfolioCategories.map((category) => ({ category: category.slug }));
}

export default async function PortfolioCategoryPage({ params }: CategoryPageProps) {
  const { category } = await params;
  const selected = portfolioCategories.find((item) => item.slug === category);

  if (!selected) {
    notFound();
  }

  return (
    <section className="glass-panel space-y-4">
      <h1 className="section-title">{selected.title}</h1>
      <p className="section-copy">{selected.description}</p>
      <div className="grid gap-3 text-sm text-[var(--muted)] md:grid-cols-2">
        {selected.highlights.map((item) => (
          <div key={item} className="glass-card">{item}</div>
        ))}
      </div>
    </section>
  );
}
