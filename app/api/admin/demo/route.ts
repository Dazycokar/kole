import { NextRequest } from "next/server";
import { mutate } from "@/lib/db";
import { getUser, isAdmin } from "@/lib/auth";
import { err, ok, sameOrigin } from "@/lib/http";

export const dynamic = "force-dynamic";

/** Removes the sample listings and sample developers that come with a fresh install. */
export async function DELETE(req: NextRequest) {
  if (!sameOrigin(req)) return err("Request blocked.", 403);
  const user = await getUser();
  if (!isAdmin(user)) return err("Admins only.", 403);

  const removed = await mutate((db) => {
    const ids = new Set(db.properties.filter((p) => p.demo).map((p) => p.id));
    db.properties = db.properties.filter((p) => !ids.has(p.id));
    const threads = new Set(db.threads.filter((t) => ids.has(t.propertyId)).map((t) => t.id));
    db.threads = db.threads.filter((t) => !threads.has(t.id));
    db.messages = db.messages.filter((m) => !threads.has(m.threadId));
    db.saves = db.saves.filter((s) => !ids.has(s.propertyId));
    db.users = db.users.filter((u) => !(u.demo && u.role === "developer"));
    return ids.size;
  });
  return ok({ removed });
}
