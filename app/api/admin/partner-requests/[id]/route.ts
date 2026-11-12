import { NextRequest } from "next/server";
import { mutate } from "@/lib/db";
import { getUser, isAdmin } from "@/lib/auth";
import { err, ok, readJson, sameOrigin } from "@/lib/http";

export const dynamic = "force-dynamic";
type Ctx = { params: { id: string } };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  if (!sameOrigin(req)) return err("Request blocked.", 403);
  if (!isAdmin(await getUser())) return err("Admins only.", 403);
  const body = await readJson(req);
  const handled = body?.handled === true;
  const res = await mutate((db) => {
    const r = db.partnerRequests.find((x) => x.id === params.id);
    if (!r) return 404;
    r.handled = handled;
    return 200;
  });
  return res === 404 ? err("Request not found.", 404) : ok();
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  if (!sameOrigin(req)) return err("Request blocked.", 403);
  if (!isAdmin(await getUser())) return err("Admins only.", 403);
  await mutate((db) => {
    db.partnerRequests = db.partnerRequests.filter((x) => x.id !== params.id);
  });
  return ok();
}
