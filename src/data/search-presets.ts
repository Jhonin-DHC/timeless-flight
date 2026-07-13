export interface SearchPreset {
  id: string;
  name: string;
  keywords: string;
  label: string;
}

/** Premade keyword watches for Admin → Search. */
export const SEARCH_PRESETS: SearchPreset[] = [
  {
    id: "rolex-steel-sports",
    name: "Rolex Steel Sports",
    label: 'Rolex Steel Sports (Submariner 126610LN / GMT-Master II "Pepsi" or "Batgirl")',
    keywords: "Rolex Submariner 126610LN GMT-Master II Pepsi Batgirl"
  },
  {
    id: "tudor-black-bay",
    name: "Tudor Black Bay Series",
    label: "Tudor Black Bay Series (BB58 / BB54 / BB58 GMT)",
    keywords: "Tudor Black Bay BB58 BB54 BB58 GMT"
  },
  {
    id: "omega-speedmaster",
    name: "Omega Speedmaster Professional",
    label: "Omega Speedmaster Professional (Hesalite/Sapphire)",
    keywords: "Omega Speedmaster Professional Hesalite Sapphire Moonwatch"
  },
  {
    id: "omega-seamaster-300",
    name: "Omega Seamaster Professional 300M",
    label: "Omega Seamaster Professional (Hesalite/Sapphire) 300M",
    keywords: "Omega Seamaster Professional 300M Hesalite Sapphire"
  },
  {
    id: "seiko-6139-pogue",
    name: 'Seiko 6139 "Pogue"',
    label: 'Seiko 6139 "Pogue"',
    keywords: "Seiko 6139 Pogue"
  },
  {
    id: "seiko-6105-willard",
    name: 'Seiko 6105 "Captain Willard"',
    label: 'Seiko 6105 "Captain Willard"',
    keywords: "Seiko 6105 Captain Willard"
  }
];

export const CUSTOM_PRESET_ID = "custom";
