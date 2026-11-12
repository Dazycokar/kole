import { newId } from "@/lib/ids";
import { NextRequest } from "next/server";
import { mutate } from "@/lib/db";
import { getUser, isAdmin } from "@/lib/auth";
import { err, ok, readJson, sameOrigin } from "@/lib/http";
import { parseProperty } from "@/lib/validate";
import type { Property } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return err("Request blocked.", 403);
  const user = await getUser();
  if (!user) return err("Log in first.", 401);
  if (!isAdmin(user)) return err("Only the Kolé team can add listings.", 403);

  const body = await readJson(req);
  if (!body) return err("Send the form as JSON.");
  const parsed = parseProperty(body);
  if (!parsed.ok) return err(parsed.error);
  const d = parsed.data;

  const now = new Date().toISOString();
  const property = await mutate((db) => {
    const dev = db.users.find((u) => u.id === d.developerId && u.role === "developer");
    if (!dev) return null;
    const p: Property = {
      id: newId(),
      ...d,
      featured: !!d.featured,
      developerName: dev.company || dev.name,
      developerId: dev.id,
      createdAt: now,
      updatedAt: now,
    };
    db.properties.push(p);
    return p;
  });
  if (!property) return err("That developer was not found. Add them under Developers first.", 400);
  return ok({ property }, 201);
}
