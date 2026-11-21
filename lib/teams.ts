export function parseAreas(v: unknown): string[] {
  const raw = Array.isArray(v) ? v.join(",") : typeof v === "string" ? v : "";
  return Array.from(new Set(raw.split(",").map((x) => x.trim().slice(0, 40)).filter(Boolean))).slice(0, 12);
}
