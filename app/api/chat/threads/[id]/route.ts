import { newId } from "@/lib/ids";
import { NextRequest } from "next/server";
import { mutate, readDb } from "@/lib/db";
import { getUser, isAdmin } from "@/lib/auth";
import { staffCanSee } from "@/lib/queries";
import { err, ok, limited, readJson, sameOrigin, str } from "@/lib/http";
import type { ChatMessage, Db, Message, Thread, User } from "@/lib/types";

export const dynamic = "force-dynamic";
type Ctx = { params: { id: string } };

/** Which side of the conversation this person is on, or null if they may not open it. */
function sideOf(db: Db, t: Thread, user: User): "client" | "staff" | null {
  if (t.clientId === user.id) return "client";
  const p = db.properties.find((x) => x.id === t.propertyId);
  if (!p) return null;
  if (staffCanSee(user, t)) return "staff";
  return null;
}

function view(db: Db, t: Thread, side: "client" | "staff", viewer?: User) {
  const p = db.properties.find((x) => x.id === t.propertyId)!;
  const client = db.users.find((u) => u.id === t.clientId);
  const team = db.teams.find((x) => x.id === t.teamId);
  const messages: ChatMessage[] = db.messages
    .filter((m) => m.threadId === t.id)
    .map((m) => ({
      ...m,
      senderName: m.senderRole === "client" ? client?.name ?? "Client" : m.agentName || "Kolé team",
    }));
  const canAssign = side === "staff" && !!viewer && isAdmin(viewer);
  return {
    thread: { id: t.id },
    property: { id: p.id, title: p.title, photo: p.photos[0] ?? "", area: `${p.area}, ${p.city}`, developerName: p.developerName },
    counterpart: side === "client" ? "Kolé" : client?.name ?? "Client",
    counterpartNote: side === "staff" ? client?.country : undefined,
    team: team ? { id: team.id, name: team.name, focus: team.focus ?? "" } : null,
    canAssign,
    teams: canAssign ? db.teams.map((x) => ({ id: x.id, name: x.name })) : undefined,
    messages,
  };
}

export async function GET(_req: NextRequest, { params }: Ctx) {
  const user = await getUser();
  if (!user) return err("Log in first.", 401);
  const db = await readDb();
  const t = db.threads.find((x) => x.id === params.id);
  if (!t) return err("Conversation not found.", 404);
  const side = sideOf(db, t, user);
  if (!side) return err("You cannot open this conversation.", 403);

  const readKey = side === "client" ? "clientReadAt" : "staffReadAt";
  const other = side === "client" ? "staff" : "client";
  const hasUnread = db.messages.some((m) => m.threadId === t.id && m.senderRole === other && m.createdAt > t[readKey]);
  if (hasUnread) {
    await mutate((d) => {
      const live = d.threads.find((x) => x.id === t.id);
      if (live) live[readKey] = new Date().toISOString();
    });
  }
  return ok(view(db, t, side, user));
}

export async function POST(req: NextRequest, { params }: Ctx) {
  if (!sameOrigin(req)) return err("Request blocked.", 403);
  const user = await getUser();
  if (!user) return err("Log in first.", 401);
  if (limited(`msg:${user.id}`, 40, 60_000)) return err("You are sending messages too fast. Slow down a little.", 429);
  const body = await readJson(req);
  const text = str(body?.body, 2000);
  if (!text) return err("Write a message first.");

  const result = await mutate((db) => {
    const t = db.threads.find((x) => x.id === params.id);
    if (!t) return { status: 404 as const };
    const side = sideOf(db, t, user);
    if (!side) return { status: 403 as const };
    const now = new Date().toISOString();
    const myTeam = side === "staff" && user.role === "agent" ? db.teams.find((x) => x.id === user.teamId) : undefined;
    const m: Message = {
      id: newId(),
      threadId: t.id, senderId: user.id, senderRole: side, body: text, createdAt: now,
      ...(side === "staff" ? { agentName: user.role === "admin" ? "Kolé admin" : user.name, teamName: myTeam?.name } : {}),
    };
    db.messages.push(m);
    t.updatedAt = now;
    if (side === "client") t.clientReadAt = now;
    else t.staffReadAt = now;
    return { status: 200 as const, view: view(db, t, side, user) };
  });
  if (result.status === 404) return err("Conversation not found.", 404);
  if (result.status === 403) return err("You cannot write in this conversation.", 403);
  return ok(result.view);
}

/** The admin moves a conversation to another team (or back to nobody). */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  if (!sameOrigin(req)) return err("Request blocked.", 403);
  const user = await getUser();
  if (!user) return err("Log in first.", 401);
  if (!isAdmin(user)) return err("Only the admin can move a conversation to another team.", 403);
  const body = await readJson(req);
  const teamId = str(body?.teamId, 60);
  const result = await mutate((db) => {
    const t = db.threads.find((x) => x.id === params.id);
    if (!t) return { status: 404 as const };
    if (teamId && !db.teams.some((x) => x.id === teamId)) return { status: 400 as const };
    t.teamId = teamId || undefined;
    return { status: 200 as const, view: view(db, t, "staff", user) };
  });
  if (result.status === 404) return err("Conversation not found.", 404);
  if (result.status === 400) return err("That team does not exist.");
  return ok(result.view);
}
