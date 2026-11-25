import { NextRequest } from "next/server";
import { mutate, readDb } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { err, ok, readJson, sameOrigin } from "@/lib/http";
import { parseProperty } from "@/lib/validate";
import { canManage } from "@/lib/queries";

export const dynamic = "force-dynamic";
type Ctx = { params: { id: string } };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const user = await getUser();
  if (!user) return err("Log in first.", 401);
  const db = await readDb();
  const p = db.properties.find((x) => x.id === params.id);
  if (!p) return err("Property not found.", 404);
  if (!canManage(user, p)) return err("You cannot open this property.", 403);
  return ok({ property: p });
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  if (!sameOrigin(req)) return err("Request blocked.", 403);
  const user = await getUser();
  if (!user) return err("Log in first.", 401);
  const body = await readJson(req);
  if (!body) return err("Send the form as JSON.");
  const parsed = parseProperty(body);
  if (!parsed.ok) return err(parsed.error);
  const d = parsed.data;

  const result = await mutate((db) => {
    const p = db.properties.find((x) => x.id === params.id);
    if (!p) return { status: 404 as const };
    if (!canManage(user, p)) return { status: 403 as const };
    // A developer changing the title or documents means the admin's earlier check no longer applies.
    const docsChanged = JSON.stringify([...(p.docs ?? [])].sort()) !== JSON.stringify([...d.docs].sort()) || p.titleDoc !== d.titleDoc;
    if (user.role !== "admin" && docsChanged) p.verified = false;
    const dev = db.users.find((u) => u.id === d.developerId && u.role === "developer");
    if (!dev) return { status: 400 as const };
    Object.assign(p, d, {
      featured: typeof d.featured === "boolean" ? d.featured : p.featured,
      developerId: dev.id,
      developerName: dev.company || dev.name,
      updatedAt: new Date().toISOString(),
    });
    return { status: 200 as const, property: p };
  });
  if (result.status === 404) return err("Property not found.", 404);
  if (result.status === 403) return err("You cannot edit this property.", 403);
  if (result.status === 400) return err("That developer was not found.", 400);
  return ok({ property: result.property });
}

/** Quick changes from the listings table: status and published. */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  if (!sameOrigin(req)) return err("Request blocked.", 403);
  const user = await getUser();
  if (!user) return err("Log in first.", 401);
  const body = await readJson(req);
  if (!body) return err("Send the change as JSON.");

  const result = await mutate((db) => {
    const p = db.properties.find((x) => x.id === params.id);
    if (!p) return { status: 404 as const };
    if (!canManage(user, p)) return { status: 403 as const };
    if (body.status === "available" || body.status === "reserved" || body.status === "sold") p.status = body.status;
    if (typeof body.published === "boolean") p.published = body.published;
    if (typeof body.featured === "boolean" && user.role === "admin") p.featured = body.featured;
    if (typeof body.verified === "boolean" && user.role === "admin") p.verified = body.verified;
    p.updatedAt = new Date().toISOString();
    return { status: 200 as const, property: p };
  });
  if (result.status === 404) return err("Property not found.", 404);
  if (result.status === 403) return err("You cannot change this property.", 403);
  return ok({ property: result.property });
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  if (!sameOrigin(req)) return err("Request blocked.", 403);
  const user = await getUser();
  if (!user) return err("Log in first.", 401);

  const status = await mutate((db) => {
    const p = db.properties.find((x) => x.id === params.id);
    if (!p) return 404;
    if (!canManage(user, p)) return 403;
    db.properties = db.properties.filter((x) => x.id !== p.id);
    const gone = new Set(db.threads.filter((t) => t.propertyId === p.id).map((t) => t.id));
    db.threads = db.threads.filter((t) => !gone.has(t.id));
    db.messages = db.messages.filter((m) => !gone.has(m.threadId));
    db.saves = db.saves.filter((s) => s.propertyId !== p.id);
    return 200;
  });
  if (status === 404) return err("Property not found.", 404);
  if (status === 403) return err("You cannot delete this property.", 403);
  return ok();
}
