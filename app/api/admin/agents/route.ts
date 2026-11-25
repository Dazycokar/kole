import { NextRequest } from "next/server";
import { newId } from "@/lib/ids";
import { mutate } from "@/lib/db";
import { getUser, isAdmin } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { err, ok, readJson, sameOrigin, str } from "@/lib/http";
import type { User } from "@/lib/types";

export const dynamic = "force-dynamic";
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** The admin creates a login for a team member. Agents cannot sign themselves up. */
export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return err("Request blocked.", 403);
  if (!isAdmin(await getUser())) return err("Admins only.", 403);
  const b = await readJson(req);
  if (!b) return err("Send the form as JSON.");
  const name = str(b.name, 80);
  const email = str(b.email, 120).toLowerCase();
  const password = typeof b.password === "string" ? b.password : "";
  const teamId = str(b.teamId, 60);
  if (name.length < 2) return err("Enter the team member's name.");
  if (!EMAIL.test(email)) return err("Enter a valid email address.");
  if (password.length < 8 || password.length > 128) return err("Use a password of at least 8 characters.");
  const passwordHash = await hashPassword(password);
  const r = await mutate((db) => {
    if (!db.teams.some((t) => t.id === teamId)) return 400;
    if (db.users.some((u) => u.email === email)) return 409;
    const u: User = { id: newId(), name, email, passwordHash, role: "agent", teamId, status: "active", createdAt: new Date().toISOString() };
    db.users.push(u);
    return 201;
  });
  if (r === 400) return err("Choose a team for this person.");
  if (r === 409) return err("That email already has an account.", 409);
  return ok({}, 201);
}
