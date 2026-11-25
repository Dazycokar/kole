import { newId } from "@/lib/ids";
import { NextRequest } from "next/server";
import { mutate, readDb } from "@/lib/db";
import { getUser, isAdmin } from "@/lib/auth";
import { staffCanSee } from "@/lib/queries";
import { teamOnline, touchPresence } from "@/lib/presence";
import { ASSISTANT, rerouteIfNeeded, respondToClient } from "@/lib/assistant";
import { checkAttachments, toChatAttachment } from "@/lib/chatfiles";
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
      attachments: m.attachments?.length ? m.attachments.map((a) => toChatAttachment(db, a)) : undefined,
      senderName: m.senderRole === "client" ? client?.name ?? "Client" : m.senderRole === "system" ? ASSISTANT : m.agentName || "Kolé team",
    }));
  const canAssign = side === "staff" && !!viewer && isAdmin(viewer);
  return {
    thread: { id: t.id },
    property: { id: p.id, title: p.title, photo: p.photos[0] ?? "", area: `${p.area}, ${p.city}`, developerName: p.developerName },
    counterpart: side === "client" ? "Kolé" : client?.name ?? "Client",
    counterpartNote: side === "staff" ? client?.country : undefined,
    team: team ? { id: team.id, name: team.name, focus: team.focus ?? "", online: teamOnline(db, team.id) } : null,
    canAssign,
    teams: canAssign ? db.teams.map((x) => ({ id: x.id, name: x.name })) : undefined,
    messages,
  };
}

export async function GET(_req: NextRequest, { params }: Ctx) {
  const user = await getUser();
  if (!user) return err("Log in first.", 401);
  await touchPresence(user);
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
  const dbNow = await readDb();
  const files = checkAttachments(dbNow, user.id, body?.attachments);
  if (!files) return err("One of the files could not be attached. Send it again.");
  if (!text && !files.length) return err("Write a message or attach a file first.");

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
      ...(files.length ? { attachments: files } : {}),
      ...(side === "staff" ? { agentName: user.role === "admin" ? "Kolé admin" : user.name, teamName: myTeam?.name } : {}),
    };
    db.messages.push(m);
    if (side === "client") {
      const p = db.properties.find((x) => x.id === t.propertyId);
      if (p) rerouteIfNeeded(db, t, p, new Date(Date.parse(now) + 1).toISOString());
    }
    t.updatedAt = now;
    if (side === "client") t.clientReadAt = now;
    else t.staffReadAt = now;
    const property = side === "client" ? db.properties.find((x) => x.id === t.propertyId) : undefined;
    const autoReply = side === "client" && property && !db.messages.some((x) => x.threadId === t.id && x.senderRole === "staff")
      ? {
          threadId: t.id,
          messageId: m.id,
          property,
          history: db.messages.filter((x) => x.threadId === t.id).slice(-8).map(({ senderRole, body }) => ({ senderRole, body })),
        }
      : null;
    return { status: 200 as const, view: view(db, t, side, user), autoReply };
  });
  if (result.status === 404) return err("Conversation not found.", 404);
  if (result.status === 403) return err("You cannot write in this conversation.", 403);
  const autoReply = result.autoReply;
  if (!autoReply) return ok(result.view);

  const reply = await respondToClient(autoReply.property, autoReply.history);
  const updatedView = await mutate((db) => {
    const t = db.threads.find((x) => x.id === autoReply.threadId);
    const triggeringMessage = db.messages.find((x) => x.id === autoReply.messageId && x.threadId === autoReply.threadId);
    if (!t || !triggeringMessage || db.messages.some((x) => x.threadId === t.id && x.senderRole === "staff")) return null;
    if (db.messages.some((x) => x.threadId === t.id && x.replyToId === triggeringMessage.id)) return null;
    const now = new Date().toISOString();
    const team = db.teams.find((x) => x.id === t.teamId);
    db.messages.push({
      id: newId(),
      threadId: t.id,
      senderId: "system",
      senderRole: "system",
      agentName: ASSISTANT,
      teamName: team?.name,
      replyToId: triggeringMessage.id,
      body: reply,
      createdAt: now,
    });
    t.updatedAt = now;
    return view(db, t, "client", user);
  });
  return ok(updatedView ?? result.view);
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
