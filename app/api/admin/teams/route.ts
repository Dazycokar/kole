import { NextRequest } from "next/server";
import { newId } from "@/lib/ids";
import { mutate } from "@/lib/db";
import { getUser, isAdmin } from "@/lib/auth";
import { err, ok, readJson, sameOrigin, str } from "@/lib/http";
import { parseAreas } from "@/lib/teams";
import type { Team } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return err("Request blocked.", 403);
  if (!isAdmin(await getUser())) return err("Admins only.", 403);
  const b = await readJson(req);
  const name = str(b?.name, 50);
  if (name.length < 2) return err("Give the team a name.");
  const team = await mutate((db) => {
    if (db.teams.some((t) => t.name.toLowerCase() === name.toLowerCase())) return null;
    const t: Team = { id: newId(), name, focus: str(b?.focus, 120) || undefined, areas: parseAreas(b?.areas), createdAt: new Date().toISOString() };
    db.teams.push(t);
    return t;
  });
  if (!team) return err("A team with that name already exists.", 409);
  return ok({ team }, 201);
}
