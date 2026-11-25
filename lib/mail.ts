import nodemailer, { type Transporter } from "nodemailer";

/**
 * Email over SMTP. Set these in .env (or Vercel Environment Variables):
 *   SMTP_HOST, SMTP_PORT (587 or 465), SMTP_SECURE (true for port 465), SMTP_USER, SMTP_PASS, SMTP_FROM
 *   CONTACT_TO  where contact-form messages are sent (defaults to ADMIN_EMAIL, then SMTP_USER)
 * With no SMTP_HOST the site still works: messages are saved for the admin and no email is sent.
 */
const HOST = process.env.SMTP_HOST || "";
const PORT = Number(process.env.SMTP_PORT) || 587;
const SECURE = process.env.SMTP_SECURE ? /^(1|true|yes)$/i.test(process.env.SMTP_SECURE) : PORT === 465;
const USER = process.env.SMTP_USER || "";
const PASS = process.env.SMTP_PASS || "";

export const smtpOn = !!HOST;
export const mailFrom = process.env.SMTP_FROM || (USER ? `Kolé <${USER}>` : "Kolé <no-reply@localhost>");
export const contactTo = process.env.CONTACT_TO || process.env.ADMIN_EMAIL || USER;

type G = typeof globalThis & { __koleMail?: Transporter };
const g = globalThis as G;

function transport(): Transporter {
  if (!g.__koleMail) {
    g.__koleMail = nodemailer.createTransport({
      host: HOST,
      port: PORT,
      secure: SECURE,
      auth: USER ? { user: USER, pass: PASS } : undefined,
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 15_000,
    });
  }
  return g.__koleMail;
}

export const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Sends one email. Never throws: returns false when SMTP is off or the server refused. */
export async function sendMail(o: { to: string; subject: string; text: string; html?: string; replyTo?: string }): Promise<boolean> {
  if (!smtpOn || !o.to) return false;
  try {
    await transport().sendMail({ from: mailFrom, to: o.to, subject: o.subject.replace(/[\r\n]+/g, " ").slice(0, 200), text: o.text, html: o.html, replyTo: o.replyTo });
    return true;
  } catch (e) {
    console.error("[mail] send failed:", (e as Error).message);
    return false;
  }
}
