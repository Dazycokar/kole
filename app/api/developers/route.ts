import { readDb } from "@/lib/db";
import { DEV_TYPES, devTypeLabel } from "@/lib/devtypes";
import { ok } from "@/lib/http";

export const dynamic = "force-dynamic";

/** Developers with at least one live listing, for the mobile app. Contact details stay private. */
export async function GET() {
  const db = await readDb();
  const items = db.users
    .filter((u) => u.role === "developer" && u.status === "active")
    .map((d) => {
      const mine = db.properties.filter((p) => p.developerId === d.id && p.published).sort((a, b) => b.price - a.price);
      return {
        id: d.id, name: d.name, devType: d.devType ?? "", devTypeLabel: devTypeLabel(d.devType), about: d.about ?? "",
        verified: !!d.verified, count: mine.length, areas: Array.from(new Set(mine.map((p) => p.area))).slice(0, 3),
        topPrice: mine[0]?.price ?? 0, photo: mine[0]?.photos[0] ?? "",
      };
    })
    .filter((d) => d.count > 0)
    .sort((a, b) => Number(b.verified) - Number(a.verified) || b.count - a.count);
  return ok({ items, types: DEV_TYPES.map((t) => ({ id: t.id, label: t.label })) });
}
