import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getUser, isAdmin } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { timeAgo } from "@/lib/format";
import { smtpOn, contactTo } from "@/lib/mail";
import ContactAdminRow from "@/components/ContactAdmin";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Contact messages" };

export default async function ContactMessages() {
  const user = await getUser();
  if (!isAdmin(user)) redirect("/admin");
  const db = await readDb();
  const list = db.contacts.slice().sort((a, b) => Number(a.handled) - Number(b.handled) || b.createdAt.localeCompare(a.createdAt));
  return (
    <>
      <div className="sec-head slim">
        <h2>Contact messages</h2>
        <p>Sent from the Contact page and the app.</p>
      </div>
      <p className={`notice${smtpOn ? "" : " warn"}`}>
        {smtpOn ? `Email is on. New messages are also sent to ${contactTo || "(set CONTACT_TO)"}.` : "SMTP is not set, so messages are only saved here. Add SMTP_HOST, SMTP_USER, SMTP_PASS and CONTACT_TO to your .env to get them by email."}
      </p>
      {list.length === 0 ? (
        <div className="empty">No messages yet.</div>
      ) : (
        <div className="reqs">
          {list.map((c) => (
            <article key={c.id} className={`req${c.handled ? " done" : ""}`}>
              <div>
                <b>{c.name}</b> <span className="muted">· {c.topic} · {timeAgo(c.createdAt)}</span>
                <p style={{ whiteSpace: "pre-wrap" }}>{c.message}</p>
                <p className="muted small">
                  <a href={`mailto:${c.email}`}>{c.email}</a>
                  {c.phone ? ` · ${c.phone}` : ""}
                  {c.propertyId ? ` · property ${c.propertyId}` : ""}
                  {smtpOn ? (c.emailed ? " · emailed" : " · email failed") : ""}
                </p>
              </div>
              <ContactAdminRow id={c.id} handled={c.handled} />
            </article>
          ))}
        </div>
      )}
    </>
  );
}
