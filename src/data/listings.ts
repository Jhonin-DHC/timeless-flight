export interface Listing {
  id: string;
  storefrontProductId?: string;
  slug: string;
  name: string;
  brand: string;
  condition: "New" | "Excellent" | "Very Good";
  year: number;
  priceUsd: number;
  imageUrl: string;
  /** Additional images after the main thumbnail (`imageUrl`). */
  imageUrls?: string[];
  description: string;
}

export const listings: Listing[] = [
  {
    id: "lst_1",
    storefrontProductId: "ghl_prod_rolex_submariner_126610ln",
    slug: "rolex-submariner-date-126610ln",
    name: "Rolex Submariner Date 126610LN",
    brand: "Rolex",
    condition: "Excellent",
    year: 2023,
    priceUsd: 14250,
    imageUrl: "https://images.unsplash.com/photo-1524592094714-0f0654e20314",
    description: "Ceramic bezel diver with full set and sharp case lines."
  },
  {
    id: "lst_2",
    storefrontProductId: "ghl_prod_omega_speedmaster_moonwatch",
    slug: "omega-speedmaster-moonwatch-professional",
    name: "Omega Speedmaster Moonwatch Professional",
    brand: "Omega",
    condition: "Very Good",
    year: 2021,
    priceUsd: 6350,
    imageUrl: "https://images.unsplash.com/photo-1547996160-81dfa63595aa",
    description: "Hesalite crystal reference with iconic chronograph heritage."
  },
  {
    id: "lst_3",
    storefrontProductId: "ghl_prod_ap_royal_oak_15500st",
    slug: "audemars-piguet-royal-oak-15500st",
    name: "Audemars Piguet Royal Oak 15500ST",
    brand: "Audemars Piguet",
    condition: "Excellent",
    year: 2022,
    priceUsd: 49500,
    imageUrl: "https://images.unsplash.com/photo-1612817159949-195b6eb9e31a",
    description: "41mm steel sports icon featuring AP caliber 4302."
  },
  {
    id: "lst_4",
    storefrontProductId: "ghl_prod_patek_nautilus_5711",
    slug: "patek-philippe-nautilus-5711",
    name: "Patek Philippe Nautilus 5711",
    brand: "Patek Philippe",
    condition: "New",
    year: 2024,
    priceUsd: 138000,
    imageUrl: "https://images.unsplash.com/photo-1523170335258-f5ed11844a49",
    description: "Blue dial grail with complete accessories and documentation."
  },
  {
    id: "lst_5",
    storefrontProductId: "ghl_prod_breitling_lady_navitimer_80200",
    slug: "breitling-lady-navitimer-2500-80200",
    name: "Breitling Lady Navitimer 2500 Ref. 80200",
    brand: "Breitling",
    condition: "Very Good",
    year: 1992,
    priceUsd: 4950,
    imageUrl: "https://images.unsplash.com/photo-1508057198894-247b23fe5ade",
    description: "A compact 30mm-33mm Mini-Navitimer with beaded bezel and fully functional slide rule."
  },
  {
    id: "lst_6",
    storefrontProductId: "ghl_prod_breitling_navitimer_super8_eb2040",
    slug: "breitling-navitimer-super-8-eb2040",
    name: "Breitling Navitimer Super 8 Ref. EB2040",
    brand: "Breitling",
    condition: "Excellent",
    year: 2018,
    priceUsd: 6850,
    imageUrl: "https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3",
    description:
      "A bold 46mm instrument watch inspired by the WWII-era Breitling Reference 637 stopwatch, with oversized crown and B20 movement."
  },
  {
    id: "lst_7",
    storefrontProductId: "ghl_prod_breitling_super8_ab2040101b1x1",
    slug: "breitling-super-8-ab2040101b1x1",
    name: "Breitling Super 8 Ref. AB2040101B1X1",
    brand: "Breitling",
    condition: "Excellent",
    year: 2019,
    priceUsd: 6590,
    imageUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9",
    description:
      "Steel black-dial Super 8 with left-side crown, red arrow timing pointer, and COSC-certified B20 caliber."
  }
];
