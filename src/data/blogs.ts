import type { BlogCategory } from "@/lib/blog-types";

export interface StaticBlogPost {
  slug: string;
  title: string;
  excerpt: string;
  category: BlogCategory;
  body: string;
}

export const blogs: StaticBlogPost[] = [
  {
    slug: "how-to-evaluate-watch-condition",
    title: "How to Evaluate Watch Condition Like a Collector",
    excerpt: "A practical checklist for case, dial, movement, and bracelet inspection.",
    category: "buying-guides",
    body: `A practical checklist for case, dial, movement, and bracelet inspection.

## Case and crystal
Look for even lugs, proud bevels, and a crystal free of deep pits. Over-polishing is harder to reverse than honest wear.

## Dial and hands
Original dials show consistent printing and even lume. Aftermarket hands or refinished dials usually lower collector demand.

## Movement and bracelet
Ask whether the watch is keeping time and when it was last serviced. Bracelets stretch; end links and clasps tell you how the piece was worn.`
  },
  {
    slug: "why-box-and-papers-matter",
    title: "Why Box and Papers Matter for Resale",
    excerpt: "Understand what complete sets do for trust, liquidity, and pricing.",
    category: "market-insights",
    body: `Understand what complete sets do for trust, liquidity, and pricing.

## Trust
A matching card, papers, and box help a buyer confirm the reference and purchase history.

## Liquidity
Complete sets typically sell faster because the next owner can resell with the same confidence.

## Pricing
Papers do not replace condition, but they often support a stronger offer — especially on modern sports watches.`
  }
];
