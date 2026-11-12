import { NextRequest } from "next/server";
import { readDb } from "@/lib/db";
import { filterProperties, publishedOnly } from "@/lib/queries";
import { ok } from "@/lib/http";

export const dynamic = "force-dynamic";

/** Live search for the hero box: how many match, plus the first few. */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const g = (k: string) => sp.get(k) ?? undefined;
  const db = await readDb();
  const list = filterProperties(publishedOnly(db), {
    q: g("q"), city: g("city"), area: g("area"), type: g("type"), purpose: g("purpose"), beds: g("beds"), max: g("max"), sort: g("sort") ?? "priceDesc",
  });
  return ok({
    count: list.length,
    items: list.slice(0, 5).map((p) => ({
      id: p.id, title: p.title, area: p.area, city: p.city, type: p.type, purpose: p.purpose, price: p.price, photo: p.photos[0] ?? "",
    })),
  });
}
