import { NextRequest } from "next/server";
import { mutate, readDb } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { agentOnline, touchPresence } from "@/lib/presence";
import { err, ok, readJson, sameOrigin } from "@/lib/http";

export const dynamic = "force-dynamic";

/** Whether the signed-in agent is taking new chats. */
export async function GET() {
  const user = await getUser();
  if (!user) return err("Log in first.", 401);
  if (user.role !== "agent") return ok({ available: true, online: true, agent: false });
  await touchPresence(user);
  const db = await readDb();
  const me = db.users.find((u) => u.id === user.id)!;
  return ok({ agent: true, available: !me.away, online: agentOnline(me) });
}

export async function PATCH(req: NextRequest) {
  if (!sameOrigin(req)) return err("Request blocked.", 403);
  const user = await getUser();
  if (!user) return err("Log in first.", 401);
  if (user.role !== "agent") return err("Only team agents have an availability switch.", 403);
  const body = await readJson(req);
  const available = body?.available !== false;
  await mutate((db) => {
    const u = db.users.find((x) => x.id === user.id);
    if (u) { u.away = !available; u.lastSeen = new Date().toISOString(); }
  });
  return ok({ agent: true, available, online: available });
}
