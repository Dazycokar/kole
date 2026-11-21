import { getUser, isAdmin } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { err, ok } from "@/lib/http";

export const dynamic = "force-dynamic";

/** Contact-form messages, for the admin (website dashboard and the team app). */
export async function GET() {
  if (!isAdmin(await getUser())) return err("Admins only.", 403);
  const db = await readDb();
  const messages = db.contacts.slice().sort((a, b) => Number(a.handled) - Number(b.handled) || b.createdAt.localeCompare(a.createdAt));
  return ok({ messages });
}
