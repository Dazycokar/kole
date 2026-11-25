import { NextRequest } from "next/server";
import { mutate } from "@/lib/db";
import { getUser, isAdmin } from "@/lib/auth";
import { err, ok, readJson, sameOrigin } from "@/lib/http";
import { parseDeveloper } from "@/lib/developers";

export const dynamic = "force-dynamic";
type Ctx = { params: { id: string } };

export async function PUT(req: NextRequest, { params }: Ctx) {
  if (!sameOrigin(req)) return err("Request blocked.", 403);
  if (!isAdmin(await getUser())) return err("Admins only.", 403);
  const body = await readJson(req);
  if (!body) return err("Send the form as JSON.");
  const r = parseDeveloper(body);
  if (!r.ok) return err(r.error);
  const d = r.data;
  const res = await mutate((db) => {
    const u = db.users.find((x) => x.id === params.id && x.role === "developer");
    if (!u) return 404;
    u.company = d.company;
    u.name = d.contactName || d.company;
    u.devType = d.devType;
    u.about = d.about;
    u.rcNumber = d.rcNumber;
    u.phone = d.phone;
    u.contactEmail = d.contactEmail;
    if (typeof d.verified === "boolean") u.verified = d.verified;
    for (const p of db.properties) if (p.developerId === u.id) p.developerName = d.company;
    return 200;
  });
  if (res === 404) return err("Developer not found.", 404);
  return ok();
}

/** Quick change from the list: just the Verified tick. */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  if (!sameOrigin(req)) return err("Request blocked.", 403);
  if (!isAdmin(await getUser())) return err("Admins only.", 403);
  const body = await readJson(req);
  if (typeof body?.verified !== "boolean") return err("Send verified as true or false.");
  const res = await mutate((db) => {
    const u = db.users.find((x) => x.id === params.id && x.role === "developer");
    if (!u) return 404;
    u.verified = body.verified as boolean;
    return 200;
  });
  if (res === 404) return err("Developer not found.", 404);
  return ok();
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  if (!sameOrigin(req)) return err("Request blocked.", 403);
  if (!isAdmin(await getUser())) return err("Admins only.", 403);
  const res = await mutate((db) => {
    const u = db.users.find((x) => x.id === params.id && x.role === "developer");
    if (!u) return 404;
    if (db.properties.some((p) => p.developerId === u.id)) return 409;
    db.users = db.users.filter((x) => x.id !== u.id);
    return 200;
  });
  if (res === 404) return err("Developer not found.", 404);
  if (res === 409) return err("This developer still has listings. Delete or move them first.", 409);
  return ok();
}
