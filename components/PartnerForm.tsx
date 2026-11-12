"use client";

import { useState } from "react";

export default function PartnerForm() {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const f = new FormData(e.currentTarget);
    try {
      const r = await fetch("/api/partner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(f.entries())),
      });
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
        <h2>Thank you</h2>
        <p className="muted">The Kolé team has your request and will contact you by email or phone.</p>
      </div>
    );
  }
  return (
    <form className="authform" onSubmit={submit}>
      <label className="field"><span>Your name</span><input name="name" autoComplete="name" required /></label>
      <label className="field"><span>Company</span><input name="company" autoComplete="organization" required /></label>
      <label className="field"><span>Email</span><input name="email" type="email" autoComplete="email" required /></label>
      <label className="field"><span>Phone (optional)</span><input name="phone" type="tel" autoComplete="tel" /></label>
      <label className="field">
        <span>What do you want Kolé to list?</span>
        <textarea name="message" rows={5} maxLength={1500} required placeholder="Location, number of units or plots, price range, build stage and what documents you hold." />
      </label>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="btn solid wide" type="submit" disabled={busy}>{busy ? "Sending…" : "Send to Kolé"}</button>
    </form>
  );
}
