import { newId } from "@/lib/ids";
import { NextRequest, NextResponse } from "next/server";
import { mutate } from "@/lib/db";
import { COOKIE, cookieOptions, makeToken, publicUser } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { clientIp, err, isHttps, limited, readJson, sameOrigin, str } from "@/lib/http";
import type { User } from "@/lib/types";

export const dynamic = "force-dynamic";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return err("Request blocked.", 403);
  if (limited(`reg:${clientIp(req)}`, 10, 3600_000)) return err("Too many sign-up attempts. Try again in a while.", 429);

  const b = await readJson(req);
  if (!b) return err("Send the form as JSON.");
  const name = str(b.name, 80);
  const email = str(b.email, 120).toLowerCase();
  const password = typeof b.password === "string" ? b.password : "";
  if (b.role === "developer") return err("Developers do not need an account. Send a partner request and the Kolé team will list your property.", 400);
  const role = "client" as const;
  const phone = str(b.phone, 30);
  const country = str(b.country, 60);

  if (name.length < 2) return err("Enter your name.");
  if (!EMAIL.test(email)) return err("Enter a valid email address.");
  if (password.length < 8 || password.length > 128) return err("Use a password of at least 8 characters.");

  const passwordHash = await hashPassword(password);
  const user = await mutate((db) => {
    if (db.users.some((u) => u.email === email)) return null;
    const u: User = {
      id: newId(),
      name, email, passwordHash, role,
      phone: phone || undefined,
      country: country || undefined,
      status: "active",
      createdAt: new Date().toISOString(),
    };
    db.users.push(u);
    return u;
  });
  if (!user) return err("An account with this email already exists. Try logging in.", 409);

  const res = NextResponse.json({ ok: true, user: publicUser(user) });
  res.cookies.set(COOKIE, await makeToken(user.id), cookieOptions(isHttps(req)));
  return res;
}
