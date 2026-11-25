import { newId } from "@/lib/ids";
import { NextRequest } from "next/server";
import { mutate, readDb } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { err, ok, readJson, sameOrigin, str } from "@/lib/http";
<<<<<<< HEAD
import { canSee, threadsFor } from "@/lib/queries";
import { routeTeam, touchPresence } from "@/lib/presence";
import { greet, rerouteIfNeeded } from "@/lib/assistant";
=======
import { canSee, pickTeam, threadsFor } from "@/lib/queries";
>>>>>>> e3c4a13a10f944d9e0c0142390b1a4c1606f8fcb
import type { Thread } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getUser();
  if (!user) return err("Log in first.", 401);
<<<<<<< HEAD
  await touchPresence(user);
=======
>>>>>>> e3c4a13a10f944d9e0c0142390b1a4c1606f8fcb
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
<<<<<<< HEAD
    const now = new Date().toISOString();
    let t = db.threads.find((x) => x.propertyId === p.id && x.clientId === user.id);
    if (!t) {
      const fresh: Thread = {
        id: newId(),
        propertyId: p.id, clientId: user.id, createdAt: now, updatedAt: now, clientReadAt: now, staffReadAt: "", teamId: routeTeam(db, p).teamId,
=======
    let t = db.threads.find((x) => x.propertyId === p.id && x.clientId === user.id);
    if (!t) {
      const now = new Date().toISOString();
      const fresh: Thread = {
        id: newId(),
        propertyId: p.id, clientId: user.id, createdAt: now, updatedAt: now, clientReadAt: now, staffReadAt: "", teamId: pickTeam(db, p),
>>>>>>> e3c4a13a10f944d9e0c0142390b1a4c1606f8fcb
      };
      db.threads.push(fresh);
      t = fresh;
    } else if (!t.teamId) {
<<<<<<< HEAD
      t.teamId = routeTeam(db, p).teamId;
    }
    if (!db.messages.some((m) => m.threadId === t!.id)) greet(db, t, p, now);
    else if (rerouteIfNeeded(db, t, p, now)) t.updatedAt = now;
=======
      t.teamId = pickTeam(db, p);
    }
>>>>>>> e3c4a13a10f944d9e0c0142390b1a4c1606f8fcb
    return t;
  });
  if (!result) return err("Property not found.", 404);
  return ok({ threadId: result.id });
}
