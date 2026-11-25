import { readDb } from "@/lib/db";
import { publicProperty } from "@/lib/publicProperty";
import { err, ok } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const db = await readDb();
  const p = db.properties.find((x) => x.id === params.id && x.published);
  if (!p) return err("Property not found.", 404);
  return ok({ property: publicProperty(db, p) });
}
