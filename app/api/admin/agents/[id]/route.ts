import { NextRequest } from "next/server";
import { mutate } from "@/lib/db";
import { getUser, isAdmin } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { err, ok, readJson, sameOrigin, str } from "@/lib/http";

export const dynamic = "force-dynamic";
type Ctx = { params: { id: string } };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  if (!sameOrigin(req)) return err("Request blocked.", 403);
  if (!isAdmin(await getUser())) return err("Admins only.", 403);
  const b = await readJson(req);
  if (!b) return err("Send the form as JSON.");
  const password = typeof b.password === "string" ? b.password : "";
  if (password && (password.length < 8 || password.length > 128)) return err("Use a password of at least 8 characters.");
  const hash = password ? await hashPassword(password) : "";
  const r = await mutate((db) => {
    const u = db.users.find((x) => x.id === params.id && x.role === "agent");
    if (!u) return 404;
    if (b.teamId !== undefined) {
      const teamId = str(b.teamId, 60);
      if (!db.teams.some((t) => t.id === teamId)) return 400;
      u.teamId = teamId;
    }
    if (b.status === "active" || b.status === "suspended") u.status = b.status;
    if (hash) u.passwordHash = hash;
    return 200;
  });
  if (r === 404) return err("Team member not found.", 404);
  if (r === 400) return err("That team does not exist.");
  return ok();
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  if (!sameOrigin(req)) return err("Request blocked.", 403);
  if (!isAdmin(await getUser())) return err("Admins only.", 403);
  const r = await mutate((db) => {
    const u = db.users.find((x) => x.id === params.id && x.role === "agent");
    if (!u) return 404;
    db.users = db.users.filter((x) => x.id !== u.id);
    return 200;
  });
  if (r === 404) return err("Team member not found.", 404);
  return ok();
}
