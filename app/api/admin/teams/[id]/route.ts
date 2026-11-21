import { NextRequest } from "next/server";
import { mutate } from "@/lib/db";
import { getUser, isAdmin } from "@/lib/auth";
import { err, ok, readJson, sameOrigin, str } from "@/lib/http";
import { parseAreas } from "@/lib/teams";

export const dynamic = "force-dynamic";
type Ctx = { params: { id: string } };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  if (!sameOrigin(req)) return err("Request blocked.", 403);
  if (!isAdmin(await getUser())) return err("Admins only.", 403);
  const b = await readJson(req);
  if (!b) return err("Send the form as JSON.");
  const r = await mutate((db) => {
    const t = db.teams.find((x) => x.id === params.id);
    if (!t) return 404;
    if (typeof b.name === "string") {
      const name = str(b.name, 50);
      if (name.length < 2) return 400;
      if (db.teams.some((x) => x.id !== t.id && x.name.toLowerCase() === name.toLowerCase())) return 409;
      t.name = name;
    }
    if (typeof b.focus === "string") t.focus = str(b.focus, 120) || undefined;
    if (b.areas !== undefined) t.areas = parseAreas(b.areas);
    return 200;
  });
  if (r === 404) return err("Team not found.", 404);
  if (r === 400) return err("Give the team a name.");
  if (r === 409) return err("A team with that name already exists.", 409);
  return ok();
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  if (!sameOrigin(req)) return err("Request blocked.", 403);
  if (!isAdmin(await getUser())) return err("Admins only.", 403);
  const r = await mutate((db) => {
    const t = db.teams.find((x) => x.id === params.id);
    if (!t) return 404;
    if (db.users.some((u) => u.role === "agent" && u.teamId === t.id)) return 409;
    db.teams = db.teams.filter((x) => x.id !== t.id);
    // Open conversations go back to the admin to reassign.
    for (const th of db.threads) if (th.teamId === t.id) th.teamId = undefined;
    return 200;
  });
  if (r === 404) return err("Team not found.", 404);
  if (r === 409) return err("Move or remove this team's agents first.", 409);
  return ok();
}
