"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { countryByCode, countryByName } from "@/lib/countries";
import { splitPhone } from "@/lib/phone";
import CountrySelect from "./CountrySelect";
import PhoneField, { phoneToE164, type PhoneValue } from "./PhoneField";

export default function ProfileForm({ name, phone, country, countryCode, email }: { name: string; phone: string; country: string; countryCode?: string; email: string }) {
  const startCountry = countryByCode(countryCode) ?? countryByName(country);
  const sp = splitPhone(phone);
  const [loc, setLoc] = useState(startCountry?.code ?? "");
  const [ph, setPh] = useState<PhoneValue>({ iso: sp.iso ?? startCountry?.code ?? "NG", national: sp.national });
  const router = useRouter();
  const [msg, setMsg] = useState<{ ok: boolean; text: string; scope: "p" | "w" } | null>(null);
  const [busy, setBusy] = useState(false);

  async function send(e: React.FormEvent<HTMLFormElement>, scope: "p" | "w") {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const form = e.currentTarget;
    const f: Record<string, unknown> = Object.fromEntries(new FormData(form).entries());
    if (scope === "p") {
      const c = countryByCode(loc);
      f.country = c?.name ?? country;
      f.countryCode = c?.code;
      f.phone = "";
      if (ph.national) {
        const r = phoneToE164(ph);
        if (!r.ok) { setMsg({ ok: false, scope, text: r.error }); setBusy(false); return; }
        f.phone = r.e164;
        f.phoneCountry = ph.iso;
      }
    }
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
        <div className="field">
          <label><span>Where do you live?</span></label>
          <CountrySelect label="Country you live in" value={loc} onChange={(c) => setLoc(c.code)} placeholder={country || "Choose a country"} />
          <small>The Kolé team uses this to plan video tours at a good hour for you.</small>
        </div>
        <PhoneField value={ph} onChange={setPh} optional />
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
