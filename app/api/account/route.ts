import { NextRequest } from "next/server";
import { mutate, readDb } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/password";
import { err, limited, ok, readJson, sameOrigin, str } from "@/lib/http";

export const dynamic = "force-dynamic";

/** A buyer updates their own details, or changes their password. */
export async function PATCH(req: NextRequest) {
  if (!sameOrigin(req)) return err("Request blocked.", 403);
  const user = await getUser();
  if (!user) return err("Log in first.", 401);
  if (limited(`acct:${user.id}`, 20, 900_000)) return err("Too many changes. Wait a few minutes.", 429);
  const b = await readJson(req);
  if (!b) return err("Send the form as JSON.");

  if (typeof b.newPassword === "string") {
    const current = typeof b.currentPassword === "string" ? b.currentPassword : "";
    const db = await readDb();
    const me = db.users.find((u) => u.id === user.id);
    if (!me || !(await verifyPassword(current, me.passwordHash))) return err("Your current password is not right.", 400);
    if (b.newPassword.length < 8 || b.newPassword.length > 128) return err("Use a new password of at least 8 characters.");
    const hash = await hashPassword(b.newPassword);
    await mutate((d) => {
      const u = d.users.find((x) => x.id === user.id);
      if (u) u.passwordHash = hash;
    });
    return ok();
  }

  const name = str(b.name, 80);
  if (name.length < 2) return err("Enter your name.");
  const phone = str(b.phone, 30);
  const country = str(b.country, 60);
  await mutate((d) => {
    const u = d.users.find((x) => x.id === user.id);
    if (!u) return;
    u.name = name;
    u.phone = phone || undefined;
    u.country = country || undefined;
  });
  return ok();
}
