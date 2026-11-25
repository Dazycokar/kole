"use client";

import { useState } from "react";
import { TOPICS } from "@/lib/contact";

export default function ContactForm({ propertyId, defaultTopic }: { propertyId?: string; defaultTopic?: string }) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const f = Object.fromEntries(new FormData(e.currentTarget).entries());
    try {
      const r = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...f, propertyId }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) setError(j.error || "Something went wrong. Try again.");
      else setDone(true);
    } catch {
      setError("Could not reach the server. Check your connection.");
    }
    setBusy(false);
  }

  if (done) {
    return (
      <div className="authcard" role="status">
        <h2>Message sent</h2>
        <p className="muted">Thank you. The Kolé team has it and will reply by email or phone.</p>
      </div>
    );
  }
  return (
    <form className="authform" onSubmit={submit}>
      <label className="field"><span>Your name</span><input name="name" autoComplete="name" required /></label>
      <label className="field"><span>Email</span><input name="email" type="email" autoComplete="email" required /></label>
      <label className="field"><span>Phone or WhatsApp (optional)</span><input name="phone" type="tel" autoComplete="tel" /></label>
      <label className="field">
        <span>What is it about?</span>
        <select name="topic" defaultValue={defaultTopic && TOPICS.includes(defaultTopic) ? defaultTopic : TOPICS[0]}>
          {TOPICS.map((t) => <option key={t}>{t}</option>)}
        </select>
      </label>
      <label className="field"><span>Message</span><textarea name="message" rows={6} maxLength={3000} required placeholder="Tell us what you need. If it is about a property, say which one." /></label>
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: "absolute", left: "-9999px", height: 0, width: 0, opacity: 0 }} />
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="btn solid wide" type="submit" disabled={busy}>{busy ? "Sending…" : "Send message"}</button>
    </form>
  );
}
