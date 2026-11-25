import crypto from "crypto";
import { NextRequest } from "next/server";
import { mutate, readDb } from "@/lib/db";
import { err, ok, clientIp, limited, readJson, sameOrigin, str } from "@/lib/http";
import { esc, sendMail, smtpOn } from "@/lib/mail";

export const dynamic = "force-dynamic";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const RESPONSE = "If that email belongs to a client account, reset instructions will be sent if email delivery is available.";
const TOKEN_TTL_MS = 30 * 60_000;

function publicOrigin(req: NextRequest): string | null {
  const configured = process.env.SITE_URL?.trim();
  const raw = configured || (process.env.NODE_ENV === "development" ? req.nextUrl.origin : "");
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.username || url.password || (process.env.NODE_ENV === "production" && url.protocol !== "https:")) return null;
    return url.origin;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return err("Request blocked.", 403);
  if (limited(`forgot-password:${clientIp(req)}`, 5, 15 * 60_000)) {
    return err("Too many reset requests. Wait a few minutes and try again.", 429);
  }
  const body = await readJson(req);
  if (!body) return err("Send the form as JSON.");
  const email = str(body.email, 120).toLowerCase();
  if (!EMAIL.test(email)) return err("Enter a valid email address.");
  if (!smtpOn) return err("Password reset email is temporarily unavailable. Please contact Kolé.", 503);
  const origin = publicOrigin(req);
  if (!origin) return err("Password reset is not configured. Please contact Kolé.", 503);

  const db = await readDb();
  const user = db.users.find((u) => u.email === email && u.role === "client" && u.status === "active");
  if (!user) return ok({ message: RESPONSE });

  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS).toISOString();
  await mutate((current) => {
    current.passwordResets ??= [];
    current.passwordResets = current.passwordResets.filter((reset) => reset.userId !== user.id && Date.parse(reset.expiresAt) > Date.now());
    current.passwordResets.push({ userId: user.id, tokenHash, expiresAt });
  });

  const link = `${origin}/reset-password?token=${token}`;
  const sent = await sendMail({
    to: user.email,
    subject: "Reset your Kolé password",
    text: `We received a request to reset your Kolé buyer account password. Use this link within 30 minutes:\n\n${link}\n\nIf you did not request this, you can ignore this email.`,
    html: `<p>We received a request to reset your Kolé buyer account password.</p><p><a href="${esc(link)}">Reset your password</a></p><p>This link expires in 30 minutes. If you did not request this, you can ignore this email.</p>`,
  });
  if (!sent) {
    await mutate((current) => {
      current.passwordResets = (current.passwordResets ?? []).filter((reset) => reset.tokenHash !== tokenHash);
    });
    console.error("[password-reset] Email delivery failed.");
  }
  return ok({ message: RESPONSE });
}
