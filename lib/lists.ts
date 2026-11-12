import type { Db, Property, User } from "./types";
import { PH } from "./seed";

/** The most expensive houses for sale. Rents are left out because they are priced per year, not to buy. */
export const topBuildings = (list: Property[], n = 6) =>
  list.filter((p) => p.type === "house" && p.purpose === "sale").sort((a, b) => b.price - a.price).slice(0, n);

/** The most expensive plots. */
export const topLands = (list: Property[], n = 6) =>
  list.filter((p) => p.type === "land").sort((a, b) => b.price - a.price).slice(0, n);

export const pricePerSqm = (p: Property) => (p.plotSqm && p.plotSqm > 0 ? Math.round(p.price / p.plotSqm) : 0);

export const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** A photo for each neighbourhood. */
export const AREA_PHOTO: Record<string, string> = {
  Ikoyi: PH.h3,
  "Victoria Island": PH.tower,
  "Banana Island": PH.h4,
  "Eko Atlantic": PH.seaLiving,
  Oniru: PH.h6,
  Ikate: PH.h7,
  "Lekki Phase 1": PH.h5,
  "Lekki (Chevron axis)": PH.h8,
  "Ajah (Lekki axis)": PH.h9,
  Maitama: PH.h1,
  Asokoro: PH.h2,
  "Wuse II": PH.h10,
  Guzape: PH.h11,
  Jabi: PH.h12,
  "Katampe Extension": PH.land1,
};

export function savedIds(db: Db, user: User | null): Set<string> {
  if (!user) return new Set();
  return new Set(db.saves.filter((s) => s.userId === user.id).map((s) => s.propertyId));
}
