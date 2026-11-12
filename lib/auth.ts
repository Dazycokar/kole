import crypto from "crypto";
import { cookies } from "next/headers";
import { readDb } from "./db";
import type { PublicUser, User } from "./types";

export const COOKIE = "kole_sid";
const MAX_AGE_DAYS = 30;

function sign(payload: string, secret: string) {
  return crypto.createHmac("sha256", secret).update(payload).digest("base64url");
}

export async function makeToken(userId: string): Promise<string> {
  const db = await readDb();
  const payload = Buffer.from(JSON.stringify({ u: userId, e: Date.now() + MAX_AGE_DAYS * 86400000 })).toString("base64url");
  return `${payload}.${sign(payload, db.meta.secret)}`;
}

export const cookieOptions = (secure: boolean) => ({
  httpOnly: true,
  sameSite: "lax" as const,
  secure,
  path: "/",
  maxAge: MAX_AGE_DAYS * 86400,
});

export async function userFromToken(token: string | undefined): Promise<User | null> {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const db = await readDb();
  const expected = sign(payload, db.meta.secret);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { u: string; e: number };
    if (!data.u || data.e < Date.now()) return null;
    const user = db.users.find((u) => u.id === data.u);
    if (!user || user.status === "suspended" || user.role === "developer") return null;
    return user;
  } catch {
    return null;
  }
}

export async function getUser(): Promise<User | null> {
  return userFromToken(cookies().get(COOKIE)?.value);
}

export function publicUser(u: User): PublicUser {
  const { passwordHash: _hash, ...rest } = u;
  void _hash;
  return rest;
}

export const isAdmin = (u: User | null): boolean => !!u && u.role === "admin";
/** Kolé staff who can answer clients: the admin and the team agents. Developers are partner records and never log in. */
export const isStaff = (u: User | null): boolean => !!u && (u.role === "admin" || u.role === "agent");
