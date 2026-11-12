import { NextRequest } from "next/server";
import { newId } from "@/lib/ids";
import { mutate } from "@/lib/db";
import { clientIp, err, limited, ok, readJson, sameOrigin, str } from "@/lib/http";

export const dynamic = "force-dynamic";
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** A developer asks Kolé to list their property. Public, because developers have no account. */
export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return err("Request blocked.", 403);
  if (limited(`partner:${clientIp(req)}`, 5, 3600_000)) return err("Too many requests from this connection. Try again later.", 429);
  const b = await readJson(req);
  if (!b) return err("Send the form as JSON.");
  const name = str(b.name, 80);
  const company = str(b.company, 80);
  const email = str(b.email, 120).toLowerCase();
  const phone = str(b.phone, 30);
  const message = str(b.message, 1500);
  if (name.length < 2) return err("Enter your name.");
  if (company.length < 2) return err("Enter your company name.");
  if (!EMAIL.test(email)) return err("Enter a valid email address.");
  if (message.length < 10) return err("Tell us a little about what you want to list.");
  await mutate((db) => {
    db.partnerRequests.push({ id: newId(), name, company, email, phone, message, createdAt: new Date().toISOString(), handled: false });
    if (db.partnerRequests.length > 500) db.partnerRequests = db.partnerRequests.slice(-500);
  });
  return ok({}, 201);
}
