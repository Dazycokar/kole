export type DevType = "luxury" | "estate" | "affordable" | "commercial" | "jv" | "individual";

export const DEV_TYPES: { id: DevType; label: string; blurb: string }[] = [
  { id: "luxury", label: "Luxury residential", blurb: "High-end houses, penthouses and serviced apartments in places like Ikoyi, Banana Island and Maitama." },
  { id: "estate", label: "Estate and land", blurb: "Buy land in bulk, survey it and sell plots, often with roads, drainage and security." },
  { id: "affordable", label: "Affordable and mortgage-ready", blurb: "Mid-priced homes sized so buyers can use mortgage schemes such as the National Housing Fund." },
  { id: "commercial", label: "Commercial and mixed-use", blurb: "Offices, retail and towers that combine homes with shops or workspace." },
  { id: "jv", label: "Joint-venture developer", blurb: "The landowner brings the land and the developer brings capital and delivery, then they share the sales." },
  { id: "individual", label: "Individual and small developer", blurb: "Self-funded builders delivering a handful of units at a time." },
];
export const devTypeLabel = (id?: string) => DEV_TYPES.find((d) => d.id === id)?.label ?? "";
export const isDevType = (v: unknown): v is DevType => DEV_TYPES.some((d) => d.id === v);

/** Documents a developer can say are ready to show a buyer. */
export const DOCS = [
  "Certificate of Occupancy (C of O)",
  "Governor's Consent",
  "Registered Deed of Assignment",
  "Survey plan",
  "Building approval / permit",
  "Certificate of Fitness for Habitation",
] as const;

export type Stage = "ready" | "building" | "offplan";
export const STAGES: { id: Stage; label: string }[] = [
  { id: "ready", label: "Ready to move in" },
  { id: "building", label: "Under construction" },
  { id: "offplan", label: "Off-plan (not yet started)" },
];
export const stageLabel = (id?: string) => STAGES.find((s) => s.id === id)?.label ?? "";
