import type { Filters } from "./queries";

export type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export function readFilters(sp: SP): Filters {
  return {
    q: one(sp.q), city: one(sp.city), area: one(sp.area), type: one(sp.type),
    purpose: one(sp.purpose), beds: one(sp.beds), max: one(sp.max), sort: one(sp.sort),
  };
}
