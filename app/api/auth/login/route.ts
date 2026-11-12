import { NextRequest, NextResponse } from "next/server";
import { readDb } from "@/lib/db";
import { COOKIE, cookieOptions, makeToken, publicUser } from "@/lib/auth";
import { verifyPassword } from "@/lib/password";
import { clientIp, err, isHttps, limited, readJson, sameOrigin, str } from "@/lib/http";

export const dynamic = "force-dynamic";

// A real hash to compare against when the email is unknown, so timing does not reveal which emails exist.
const DUMMY = "s1$00000000000000000000000000000000$" + "00".repeat(64);

export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return err("Request blocked.", 403);
  const b = await readJson(req);
  if (!b) return err("Send the form as JSON.");
  const email = str(b.email, 120).toLowerCase();
  const password = typeof b.password === "string" ? b.password : "";
  if (!email || !password) return err("Enter your email and password.");

  if (limited(`login:${clientIp(req)}:${email}`, 8, 15 * 60_000)) {
    return err("Too many attempts. Wait a few minutes and try again.", 429);
  }

  const db = await readDb();
  const user = db.users.find((u) => u.email === email);
  const good = await verifyPassword(password, user?.passwordHash ?? DUMMY);
  if (!user || !good) return err("Email or password is not right.", 401);
  if (user.status === "suspended") return err("This account is suspended. Contact the site admin.", 403);

  const res = NextResponse.json({ ok: true, user: publicUser(user) });
  res.cookies.set(COOKIE, await makeToken(user.id), cookieOptions(isHttps(req)));
  return res;
}
