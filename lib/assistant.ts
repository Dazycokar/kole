import { newId } from "./ids";
import { onlineAgents, routeTeam, teamOnline } from "./presence";
import type { Db, Message, Property, Thread } from "./types";

export const ASSISTANT = "Kolé assistant";
const HOURS = process.env.KOLE_HOURS || "9am to 6pm, Lagos time";

function note(db: Db, t: Thread, body: string, now: string): Message {
  const team = db.teams.find((x) => x.id === t.teamId);
  const m: Message = { id: newId(), threadId: t.id, senderId: "system", senderRole: "system", agentName: ASSISTANT, teamName: team?.name, body, createdAt: now };
  db.messages.push(m);
  return m;
}

/** The automatic first message, sent before anyone from the team has said a word. */
export function greet(db: Db, t: Thread, p: Property, now: string): Message {
  const team = db.teams.find((x) => x.id === t.teamId);
  const on = teamOnline(db, t.teamId);
  const who = team ? onlineAgents(db, team.id).map((u) => u.name.split(" ")[0]) : [];
  const share = "You can send photos, documents and files in this chat with the paperclip.";
  let body: string;
  if (!team) body = `Hi, welcome to Kolé. Thanks for asking about ${p.title}. Our team will pick this up and reply here as soon as someone is free. ${share}`;
  else if (on) body = `Hi, welcome to Kolé. Thanks for asking about ${p.title}. The ${team.name} team is online right now${who.length ? ` (${who.slice(0, 2).join(" and ")})` : ""} and I'm passing your chat to them. Someone will reply here in a moment. ${share}`;
  else body = `Hi, welcome to Kolé. Thanks for asking about ${p.title}. Nobody on our team is online at this moment. I've passed your chat to the ${team.name} team and they'll reply here as soon as they're back. We're usually online ${HOURS}. ${share}`;
  return note(db, t, body, now);
}

/** Until a person from the team has replied, a chat sitting with an offline team moves to a team that is online. Returns the note it posted, if any. */
export function rerouteIfNeeded(db: Db, t: Thread, p: Property, now: string): Message | null {
  if (db.messages.some((m) => m.threadId === t.id && m.senderRole === "staff")) return null;
  if (teamOnline(db, t.teamId)) return null;
  const r = routeTeam(db, p);
  if (!r.online || !r.teamId || r.teamId === t.teamId) return null;
  t.teamId = r.teamId;
  const team = db.teams.find((x) => x.id === r.teamId)!;
  return note(db, t, `Good news: the ${team.name} team is online now, so I've moved your chat to them. They'll reply here shortly.`, now);
}
