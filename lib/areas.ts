export const CITIES = ["Lagos", "Abuja"] as const;
export type City = (typeof CITIES)[number];

/** Neighbourhoods the platform lists in. Edit these lists to add or remove areas. */
export const AREAS: Record<City, string[]> = {
  Lagos: [
    "Ikoyi",
    "Victoria Island",
    "Banana Island",
    "Eko Atlantic",
    "Oniru",
    "Ikate",
    "Lekki Phase 1",
    "Lekki (Chevron axis)",
    "Ajah (Lekki axis)",
  ],
  Abuja: ["Maitama", "Asokoro", "Wuse II", "Guzape", "Jabi", "Katampe Extension"],
};

export const HOUSE_SUBTYPES = [
  "Detached duplex",
  "Semi-detached duplex",
  "Terrace duplex",
  "Mansion",
  "Apartment",
  "Penthouse",
];
export const LAND_SUBTYPES = ["Residential plot", "Commercial plot", "Mixed-use plot"];
export const TITLE_DOCS = [
  "Certificate of Occupancy (C of O)",
  "Governor's Consent",
  "Deed of Assignment",
  "Registered Survey",
  "Right of Occupancy (R of O)",
  "Excision / Gazette",
];

export function cityOf(area: string): City | null {
  for (const c of CITIES) if (AREAS[c].includes(area)) return c;
  return null;
}
