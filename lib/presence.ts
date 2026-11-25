import { mutate } from "./db";
import type { Db, Team, User } from "./types";

/** An agent counts as online while their inbox has pinged within this time. */
export const ONLINE_MS = 75_000;
const TOUCH_EVERY_MS = 20_000;

export function agentOnline(u: User, now = Date.now()): boolean {
  return u.role === "agent" && u.status === "active" && !u.away && !!u.lastSeen && now - Date.parse(u.lastSeen) < ONLINE_MS;
}

export const teamOnline = (db: Db, teamId: string | undefined, now = Date.now()): boolean =>
  !!teamId && db.users.some((u) => u.teamId === teamId && agentOnline(u, now));

export const onlineAgents = (db: Db, teamId: string, now = Date.now()) => db.users.filter((u) => u.teamId === teamId && agentOnline(u, now));

/** Records that this staff member has the inbox open. Writes at most every 20 seconds per person. */
export async function touchPresence(user: User): Promise<void> {
  if (user.role !== "agent") return;
  if (user.lastSeen && Date.now() - Date.parse(user.lastSeen) < TOUCH_EVERY_MS) return;
  await mutate((db) => {
    const u = db.users.find((x) => x.id === user.id);
    if (u) u.lastSeen = new Date().toISOString();
  });
}

/** Picks the team for a chat. Teams with someone online now come first (those covering the area before the rest), then offline teams by the same rule. */
export function routeTeam(db: Db, p: { area: string; city: string }, now = Date.now()): { teamId?: string; online: boolean } {
  const open = db.teams.filter((t) => db.users.some((u) => u.role === "agent" && u.teamId === t.id && u.status === "active"));
  if (!open.length) return { online: false };
  const area = p.area.trim().toLowerCase();
  const city = p.city.trim().toLowerCase();
  const covers = (t: Team) => t.areas.some((a) => a.toLowerCase() === area || a.toLowerCase() === city);
  const load = (t: Team) => db.threads.filter((x) => x.teamId === t.id).length;
  const best = (list: Team[]) => list.slice().sort((a, b) => load(a) - load(b) || a.name.localeCompare(b.name))[0];
  const on = open.filter((t) => teamOnline(db, t.id, now));
  const pool = on.length ? (on.filter(covers).length ? on.filter(covers) : on) : open.filter(covers).length ? open.filter(covers) : open;
  return { teamId: best(pool).id, online: on.length > 0 };
}
