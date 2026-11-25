import type { Db, Property, Thread, ThreadSummary, User } from "./types";
import { isStaff } from "./auth";

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

/** Chat threads the person is allowed to see. */
export function threadsFor(db: Db, user: User): ThreadSummary[] {
  const staff = isStaff(user);
  const out: ThreadSummary[] = [];
  for (const t of db.threads) {
    const p = db.properties.find((x) => x.id === t.propertyId);
    if (!p) continue;
    const msgs = db.messages.filter((m) => m.threadId === t.id);
    if (staff) {
      if (!msgs.some((m) => m.senderRole !== "system") || !staffCanSee(user, t)) continue;
    } else if (t.clientId !== user.id) continue;

    const last = staff ? msgs.filter((m) => m.senderRole !== "system").pop() : msgs[msgs.length - 1];
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
      lastMessage: last ? { body: last.body || (last.attachments?.length ? attachLabel(last.attachments) : ""), createdAt: last.createdAt, mine: staff ? last.senderRole === "staff" : last.senderRole === "client" } : null,
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

export function attachLabel(a: { mime: string; name: string }[]): string {
  if (!a.length) return "";
  const img = a.every((x) => x.mime.startsWith("image/"));
  if (a.length === 1) return img ? "📷 Photo" : `📎 ${a[0].name}`;
  return img ? `📷 ${a.length} photos` : `📎 ${a.length} files`;
}
