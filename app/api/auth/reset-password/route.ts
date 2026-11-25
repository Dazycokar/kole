import crypto from "crypto";
import { NextRequest } from "next/server";
import { mutate, readDb } from "@/lib/db";
import { err, ok, clientIp, limited, readJson, sameOrigin, str } from "@/lib/http";
import { hashPassword } from "@/lib/password";

export const dynamic = "force-dynamic";

const INVALID = "This reset link is invalid or has expired. Request a new one to continue.";

export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return err("Request blocked.", 403);
  if (limited(`reset-password:${clientIp(req)}`, 10, 15 * 60_000)) {
    return err("Too many attempts. Wait a few minutes and try again.", 429);
  }
  const body = await readJson(req);
  if (!body) return err("Send the form as JSON.");
  const token = str(body.token, 64);
  const password = typeof body.password === "string" ? body.password : "";
  if (!/^[a-f0-9]{64}$/.test(token)) return err(INVALID, 400);
  if (password.length < 8 || password.length > 128) return err("Use a password between 8 and 128 characters.");

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const db = await readDb();
  const reset = db.passwordResets?.find((item) => item.tokenHash === tokenHash && Date.parse(item.expiresAt) > Date.now());
  if (!reset) return err(INVALID, 400);
  const passwordHash = await hashPassword(password);

  const changed = await mutate((current) => {
    const active = current.passwordResets?.find((item) => item.tokenHash === tokenHash && Date.parse(item.expiresAt) > Date.now());
    const user = active && current.users.find((item) => item.id === active.userId && item.role === "client" && item.status === "active");
    if (!active || !user) return false;
    user.passwordHash = passwordHash;
    user.authVersion = (user.authVersion ?? 0) + 1;
    current.passwordResets = (current.passwordResets ?? []).filter((item) => item.userId !== user.id);
    return true;
  });
  if (!changed) return err(INVALID, 400);
  return ok({ message: "Your password has been changed. Please log in with your new password." });
}
