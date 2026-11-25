import { getUser, publicUser } from "@/lib/auth";
import { err, ok } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getUser();
  if (!user) return err("Log in first.", 401);
  return ok({ user: publicUser(user) });
}
