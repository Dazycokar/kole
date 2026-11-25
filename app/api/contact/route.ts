import { NextRequest } from "next/server";
import { newId } from "@/lib/ids";
import { mutate } from "@/lib/db";
import { clientIp, err, limited, ok, readJson, sameOrigin, str } from "@/lib/http";
import { contactTo, esc, sendMail } from "@/lib/mail";
import { TOPICS } from "@/lib/contact";

export const dynamic = "force-dynamic";
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** The public Contact form. Saved for the admin first, then emailed over SMTP when it is set up. */
export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return err("Request blocked.", 403);
  if (limited(`contact:${clientIp(req)}`, 5, 3600_000)) return err("Too many messages from this connection. Try again later.", 429);
  const b = await readJson(req);
  if (!b) return err("Send the form as JSON.");
  if (str(b.website, 100)) return ok({}, 201); // hidden field: bots fill it, people never see it
  const name = str(b.name, 80);
  const email = str(b.email, 120).toLowerCase();
  const phone = str(b.phone, 30);
  const topic = TOPICS.includes(str(b.topic, 60)) ? str(b.topic, 60) : TOPICS[4];
  const message = str(b.message, 3000);
  const propertyId = str(b.propertyId, 40) || undefined;
  if (name.length < 2) return err("Enter your name.");
  if (!EMAIL.test(email)) return err("Enter a valid email address.");
  if (message.length < 10) return err("Write a short message (at least 10 characters).");

  const id = newId();
  const createdAt = new Date().toISOString();
  await mutate((db) => {
    db.contacts.push({ id, name, email, phone: phone || undefined, topic, message, propertyId, createdAt, handled: false, emailed: false });
    if (db.contacts.length > 1000) db.contacts = db.contacts.slice(-1000);
  });

  const lines = [`From: ${name} <${email}>`, phone ? `Phone: ${phone}` : "", `Topic: ${topic}`, propertyId ? `Property: ${propertyId}` : "", "", message].filter((l, i) => l || i > 3);
  const sent = await sendMail({
    to: contactTo,
    replyTo: email,
    subject: `Kolé contact: ${topic} (${name})`,
    text: lines.join("\n"),
    html: `<p><b>${esc(name)}</b> &lt;${esc(email)}&gt;${phone ? ` · ${esc(phone)}` : ""}</p><p><b>${esc(topic)}</b></p><p style="white-space:pre-wrap">${esc(message)}</p>`,
  });
  if (sent) {
    await mutate((db) => { const c = db.contacts.find((x) => x.id === id); if (c) c.emailed = true; });
    // A short receipt to the sender, so they know it arrived.
    await sendMail({
      to: email,
      subject: "We got your message | Kolé",
      text: `Hello ${name},\n\nThanks for contacting Kolé. The team has your message and will reply by email or phone.\n\nYour message:\n${message}\n\nKolé`,
      html: `<p>Hello ${esc(name)},</p><p>Thanks for contacting Kolé. The team has your message and will reply by email or phone.</p><blockquote style="white-space:pre-wrap">${esc(message)}</blockquote><p>Kolé</p>`,
    });
  }
  return ok({ emailed: sent }, 201);
}
