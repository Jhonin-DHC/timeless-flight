export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
}

export const blogs: BlogPost[] = [
  {
    slug: "how-to-evaluate-watch-condition",
    title: "How to Evaluate Watch Condition Like a Collector",
    excerpt: "A practical checklist for case, dial, movement, and bracelet inspection.",
    category: "Buying Guides"
  },
  {
    slug: "why-box-and-papers-matter",
    title: "Why Box and Papers Matter for Resale",
    excerpt: "Understand what complete sets do for trust, liquidity, and pricing.",
    category: "Market Insights"
  }
];
