import type { Property } from "./types";

function trim(n: number) {
  const r = n >= 100 ? Math.round(n) : Math.round(n * 10) / 10;
  return String(r);
}

export function naira(n: number) {
  return "₦" + Math.round(n).toLocaleString("en-US");
}

export function nairaShort(n: number) {
  if (n >= 1e9) return "₦" + trim(n / 1e9) + "B";
  if (n >= 1e6) return "₦" + trim(n / 1e6) + "M";
  if (n >= 1e4) return "₦" + trim(n / 1e3) + "K";
  return naira(n);
}

export function purposeLabel(p: Pick<Property, "purpose">) {
  return p.purpose === "rent" ? "For rent" : "For sale";
}

export function statusLabel(p: Pick<Property, "status" | "purpose">) {
  if (p.status === "available") return "Available";
  if (p.status === "reserved") return "Reserved";
  return p.purpose === "rent" ? "Let" : "Sold";
}

export function timeAgo(iso: string) {
  const s = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  if (s < 86400 * 7) return `${Math.floor(s / 86400)} d ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function clock(iso: string) {
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}
