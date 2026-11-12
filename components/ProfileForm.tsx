"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ProfileForm({ name, phone, country, email }: { name: string; phone: string; country: string; email: string }) {
  const router = useRouter();
  const [msg, setMsg] = useState<{ ok: boolean; text: string; scope: "p" | "w" } | null>(null);
  const [busy, setBusy] = useState(false);

  async function send(e: React.FormEvent<HTMLFormElement>, scope: "p" | "w") {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const form = e.currentTarget;
    const f = Object.fromEntries(new FormData(form).entries());
    try {
      const r = await fetch("/api/account", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) setMsg({ ok: false, scope, text: j.error || "Could not save." });
      else {
        setMsg({ ok: true, scope, text: scope === "p" ? "Saved." : "Password changed." });
        if (scope === "w") form.reset();
        router.refresh();
      }
    } catch {
      setMsg({ ok: false, scope, text: "Could not reach the server." });
    }
    setBusy(false);
  }

  return (
    <div className="profile">
      <form className="authform" onSubmit={(e) => send(e, "p")}>
        <h3>Your details</h3>
        <label className="field"><span>Full name</span><input name="name" defaultValue={name} required /></label>
        <label className="field"><span>Email</span><input value={email} disabled readOnly /></label>
        <label className="field"><span>Phone</span><input name="phone" type="tel" defaultValue={phone} /></label>
        <label className="field">
          <span>Where do you live?</span>
          <input name="country" defaultValue={country} placeholder="e.g. London, UK" />
          <small>The Kolé team uses this to plan video tours at a good hour for you.</small>
        </label>
        {msg?.scope === "p" && <p className={msg.ok ? "form-ok" : "form-error"} role="status">{msg.text}</p>}
        <button className="btn solid" type="submit" disabled={busy}>Save details</button>
      </form>
      <form className="authform" onSubmit={(e) => send(e, "w")}>
        <h3>Change password</h3>
        <label className="field"><span>Current password</span><input name="currentPassword" type="password" autoComplete="current-password" required /></label>
        <label className="field"><span>New password</span><input name="newPassword" type="password" autoComplete="new-password" minLength={8} required /><small>At least 8 characters.</small></label>
        {msg?.scope === "w" && <p className={msg.ok ? "form-ok" : "form-error"} role="status">{msg.text}</p>}
        <button className="btn plain" type="submit" disabled={busy}>Change password</button>
      </form>
    </div>
  );
}
