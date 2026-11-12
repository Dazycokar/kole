import { newId } from "@/lib/ids";
import { NextRequest } from "next/server";
import { mutate, readDb } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { err, ok, readJson, sameOrigin, str } from "@/lib/http";
import { canSee, pickTeam, threadsFor } from "@/lib/queries";
import type { Thread } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getUser();
  if (!user) return err("Log in first.", 401);
  const db = await readDb();
  return ok({ threads: threadsFor(db, user) });
}

/** A client opens (or re-opens) their conversation about one property. */
export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return err("Request blocked.", 403);
  const user = await getUser();
  if (!user) return err("Log in first.", 401);
  if (user.role !== "client") return err("Only client accounts can start an enquiry.", 403);
  const body = await readJson(req);
  const propertyId = str(body?.propertyId, 60);

  const result = await mutate((db) => {
    const p = db.properties.find((x) => x.id === propertyId);
    if (!p || !canSee(user, p)) return null;
    let t = db.threads.find((x) => x.propertyId === p.id && x.clientId === user.id);
    if (!t) {
      const now = new Date().toISOString();
      const fresh: Thread = {
        id: newId(),
        propertyId: p.id, clientId: user.id, createdAt: now, updatedAt: now, clientReadAt: now, staffReadAt: "", teamId: pickTeam(db, p),
      };
      db.threads.push(fresh);
      t = fresh;
    } else if (!t.teamId) {
      t.teamId = pickTeam(db, p);
    }
    return t;
  });
  if (!result) return err("Property not found.", 404);
  return ok({ threadId: result.id });
}
