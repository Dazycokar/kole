import type { Db, Property, Thread, ThreadSummary, User } from "./types";
import { isStaff } from "./auth";
import type { Team } from "./types";

export interface Filters {
  q?: string;
  city?: string;
  area?: string;
  type?: string;
  purpose?: string;
  beds?: string;
  max?: string;
  sort?: string;
}

export function filterProperties(list: Property[], f: Filters): Property[] {
  const q = f.q?.trim().toLowerCase();
  const beds = Number(f.beds) || 0;
  const max = Number(f.max) || 0;
  let out = list.filter((p) => {
    if (f.city && p.city !== f.city) return false;
    if (f.area && p.area !== f.area) return false;
    if ((f.type === "house" || f.type === "land") && p.type !== f.type) return false;
    if ((f.purpose === "sale" || f.purpose === "rent") && p.purpose !== f.purpose) return false;
    if (beds && p.type === "house" && (p.beds ?? 0) < beds) return false;
    if (beds && p.type === "land") return false;
    if (max && p.price > max) return false;
    if (q && !`${p.title} ${p.area} ${p.city} ${p.subtype} ${p.description} ${p.developerName}`.toLowerCase().includes(q)) return false;
    return true;
  });
  if (f.sort === "priceAsc") out = out.sort((a, b) => a.price - b.price);
  else if (f.sort === "priceDesc") out = out.sort((a, b) => b.price - a.price);
  else out = out.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return out;
}

export const publishedOnly = (db: Db) => db.properties.filter((p) => p.published);

export function canManage(user: User | null, p: Property): boolean {
  void p;
  return !!user && user.role === "admin";
}

export function canSee(user: User | null, p: Property): boolean {
  return p.published || canManage(user, p);
}

/** Admins see every conversation. An agent sees only the ones assigned to their team. */
export function staffCanSee(user: User, t: Thread): boolean {
  if (user.role === "admin") return true;
  return user.role === "agent" && !!user.teamId && t.teamId === user.teamId;
}

/** Picks the team for a new enquiry: one that covers the property's area, otherwise the least busy. Only teams with an active agent qualify. */
export function pickTeam(db: Db, p: { area: string; city: string }): string | undefined {
  const open = db.teams.filter((t) => db.users.some((u) => u.role === "agent" && u.teamId === t.id && u.status === "active"));
  if (!open.length) return undefined;
  const area = p.area.trim().toLowerCase();
  const city = p.city.trim().toLowerCase();
  const covers = (t: Team) => t.areas.some((a) => a.toLowerCase() === area || a.toLowerCase() === city);
  const pool = open.filter(covers).length ? open.filter(covers) : open;
  const load = (t: Team) => db.threads.filter((x) => x.teamId === t.id).length;
  return pool.slice().sort((a, b) => load(a) - load(b) || a.name.localeCompare(b.name))[0].id;
}

/** Chat threads the person is allowed to see. */
export function threadsFor(db: Db, user: User): ThreadSummary[] {
  const staff = isStaff(user);
  const out: ThreadSummary[] = [];
  for (const t of db.threads) {
    const p = db.properties.find((x) => x.id === t.propertyId);
    if (!p) continue;
    const msgs = db.messages.filter((m) => m.threadId === t.id);
    if (staff) {
      if (!msgs.length || !staffCanSee(user, t)) continue;
    } else if (t.clientId !== user.id) continue;

    const last = msgs[msgs.length - 1];
    const client = db.users.find((u) => u.id === t.clientId);
    const team = db.teams.find((x) => x.id === t.teamId);
    const unread = staff ? unreadFor(t, msgs, "staff") : unreadFor(t, msgs, "client");
    out.push({
      id: t.id,
      propertyId: p.id,
      propertyTitle: p.title,
      propertyPhoto: p.photos[0] ?? "",
      propertyArea: `${p.area}, ${p.city}`,
      counterpart: staff ? client?.name ?? "Client" : "Kolé",
      counterpartNote: staff ? client?.country : undefined,
      teamId: team?.id,
      teamName: team?.name,
      lastMessage: last ? { body: last.body, createdAt: last.createdAt, mine: staff ? last.senderRole === "staff" : last.senderRole === "client" } : null,
      unread,
      updatedAt: t.updatedAt,
    });
  }
  return out.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

function unreadFor(t: Thread, msgs: { senderRole: string; createdAt: string }[], viewer: "client" | "staff") {
  const readAt = viewer === "client" ? t.clientReadAt : t.staffReadAt;
  const other = viewer === "client" ? "staff" : "client";
  return msgs.filter((m) => m.senderRole === other && m.createdAt > readAt).length;
}

export function staffUnreadTotal(db: Db, user: User): number {
  return threadsFor(db, user).reduce((n, t) => n + t.unread, 0);
}
