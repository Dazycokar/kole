import { NextRequest } from "next/server";
import { newId } from "@/lib/ids";
import crypto from "crypto";
import { mutate } from "@/lib/db";
import { getUser, isAdmin } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { err, ok, readJson, sameOrigin } from "@/lib/http";
import { parseDeveloper } from "@/lib/developers";
import type { User } from "@/lib/types";

export const dynamic = "force-dynamic";

/** Add a developer the Kolé team works with. They never log in: the admin manages everything for them. */
export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return err("Request blocked.", 403);
  if (!isAdmin(await getUser())) return err("Admins only.", 403);
  const body = await readJson(req);
  if (!body) return err("Send the form as JSON.");
  const r = parseDeveloper(body);
  if (!r.ok) return err(r.error);
  const id = newId();
  const user: User = {
    id,
    name: r.data.contactName || r.data.company,
    email: `partner-${id}@partners.kole.local`,
    passwordHash: await hashPassword(crypto.randomBytes(24).toString("hex")),
    role: "developer",
    company: r.data.company,
    devType: r.data.devType,
    about: r.data.about,
    rcNumber: r.data.rcNumber,
    phone: r.data.phone,
    contactEmail: r.data.contactEmail,
    verified: false,
    status: "active",
    createdAt: new Date().toISOString(),
  };
  await mutate((db) => {
    db.users.push(user);
  });
  return ok({ id }, 201);
}
