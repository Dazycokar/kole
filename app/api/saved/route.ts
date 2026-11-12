import { NextRequest } from "next/server";
import { mutate, readDb } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { err, ok, readJson, sameOrigin, str, limited } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getUser();
  if (!user) return err("Log in first.", 401);
  const db = await readDb();
  return ok({ ids: db.saves.filter((s) => s.userId === user.id).map((s) => s.propertyId) });
}

async function change(req: NextRequest, add: boolean) {
  if (!sameOrigin(req)) return err("Request blocked.", 403);
  const user = await getUser();
  if (!user) return err("Log in to save properties.", 401);
  if (limited(`save:${user.id}`, 120, 600_000)) return err("Slow down a little.", 429);
  const body = await readJson(req);
  const id = str(body?.propertyId, 80);
  if (!id) return err("Choose a property.");
  const res = await mutate((db) => {
    const p = db.properties.find((x) => x.id === id && x.published);
    if (add && !p) return 404;
    const has = db.saves.some((s) => s.userId === user.id && s.propertyId === id);
    if (add && !has) db.saves.push({ userId: user.id, propertyId: id, createdAt: new Date().toISOString() });
    if (!add) db.saves = db.saves.filter((s) => !(s.userId === user.id && s.propertyId === id));
    return 200;
  });
  if (res === 404) return err("Property not found.", 404);
  return ok({ saved: add });
}

export const POST = (req: NextRequest) => change(req, true);
export const DELETE = (req: NextRequest) => change(req, false);
