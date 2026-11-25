import { NextRequest } from "next/server";
import { readDb } from "@/lib/db";
import { filterProperties, publishedOnly } from "@/lib/queries";
import { publicProperty } from "@/lib/publicProperty";
import { ok } from "@/lib/http";

export const dynamic = "force-dynamic";

/** Published listings for the mobile app. Filters match the website's search. */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const g = (k: string) => sp.get(k) ?? undefined;
  const db = await readDb();
  const list = filterProperties(publishedOnly(db), {
    q: g("q"), city: g("city"), area: g("area"), type: g("type"), purpose: g("purpose"), beds: g("beds"), max: g("max"), sort: g("sort") ?? "priceDesc",
  });
  const limit = Math.min(Math.max(Number(g("limit")) || 60, 1), 100);
  return ok({ count: list.length, items: list.slice(0, limit).map((p) => publicProperty(db, p)) });
}
