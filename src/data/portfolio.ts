export interface PortfolioCategory {
  slug: string;
  title: string;
  description: string;
  highlights: string[];
}

export const portfolioCategories: PortfolioCategory[] = [
  {
    slug: "sport-icons",
    title: "Sport Icons",
    description: "High-demand integrated bracelet and dive classics.",
    highlights: ["Rolex Submariner", "AP Royal Oak", "Patek Nautilus", "Vetted serial records"]
  },
  {
    slug: "dress-collectors",
    title: "Dress Collectors",
    description: "Elegant complications and timeless precious-metal references.",
    highlights: ["Calendar complications", "Thin profile cases", "Manual finishing", "Occasion-ready curation"]
  },
  {
    slug: "modern-tool",
    title: "Modern Tool",
    description: "Contemporary watchmaking with everyday durability.",
    highlights: ["Chronometer-grade calibers", "Water resistance focus", "Ceramic bezels", "Warranty-backed examples"]
  }
];
