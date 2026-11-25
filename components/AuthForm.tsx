"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { countryByCode, guessCountry } from "@/lib/countries";
import CountrySelect from "./CountrySelect";
import PhoneField, { phoneToE164, type PhoneValue } from "./PhoneField";

interface Props {
  mode: "login" | "register";
  next?: string;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** 0 to 4. Length matters most, then a mix of letters, digits and symbols. */
function strength(pw: string): { score: number; label: string } {
  if (!pw) return { score: 0, label: "" };
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) s++;
  else if (/\d/.test(pw) || /[^A-Za-z0-9]/.test(pw)) s += pw.length >= 10 ? 1 : 0;
  s = Math.min(4, pw.length < 8 ? Math.min(s, 1) : s);
  return { score: s, label: ["Too short", "Weak", "Fair", "Good", "Strong"][pw.length < 8 ? 0 : Math.max(1, s)] };
}

function PasswordInput({ id, value, onChange, autoComplete, invalid, onBlur }: { id: string; value: string; onChange: (v: string) => void; autoComplete: string; invalid?: boolean; onBlur?: () => void }) {
  const [show, setShow] = useState(false);
  return (
    <div className={`pw${invalid ? " invalid" : ""}`}>
      <input id={id} name="password" type={show ? "text" : "password"} value={value} onChange={(e) => onChange(e.target.value)} onBlur={onBlur} autoComplete={autoComplete} aria-invalid={invalid} required />
      <button type="button" className="pw-toggle" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide password" : "Show password"} aria-pressed={show}>
        {show ? "Hide" : "Show"}
      </button>
    </div>
  );
}

export default function AuthForm({ mode, next }: Props) {
  const uid = useId();
  const register = mode === "register";
  const nextQs = next ? `?next=${encodeURIComponent(next)}` : "";
  const [v, setV] = useState({ name: "", email: "", password: "" });
  const [country, setCountry] = useState("NG");
  const [phone, setPhone] = useState<PhoneValue>({ iso: "NG", national: "" });
  const [phoneOwn, setPhoneOwn] = useState(false); // once the person picks a phone country, stop following the location
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Start from the visitor's own region (for example en-GB), so most people need no change.
  useEffect(() => {
    if (!register) return;
    const g = guessCountry(navigator.language).code;
    setCountry(g);
    setPhone((p) => ({ ...p, iso: g }));
  }, [register]);

  const touch = (k: string) => setTouched((t) => ({ ...t, [k]: true }));
  const phoneRes = phone.national ? phoneToE164(phone) : null;
  const errs: Record<string, string | null> = {
    name: register && v.name.trim().length < 2 ? "Enter your full name." : null,
    email: !EMAIL.test(v.email.trim()) ? "Enter a valid email address." : null,
    phone: register && phoneRes && !phoneRes.ok ? phoneRes.error : null,
    password: register ? (v.password.length < 8 ? "Use at least 8 characters." : null) : !v.password ? "Enter your password." : null,
  };
  const show = (k: string) => (touched[k] || touched.submit ? errs[k] : null);
  const pw = strength(v.password);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setTouched({ name: true, email: true, phone: true, password: true, submit: true });
    setError(null);
    if (Object.values(errs).some(Boolean)) return;
    setBusy(true);
    const payload: Record<string, unknown> = { email: v.email.trim(), password: v.password };
    if (register) {
      const c = countryByCode(country);
      payload.name = v.name.trim();
      payload.role = "client";
      payload.country = c?.name;
      payload.countryCode = c?.code;
      if (phoneRes?.ok) { payload.phone = phoneRes.e164; payload.phoneCountry = phone.iso; }
    }
    try {
      const r = await fetch(`/api/auth/${mode}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        setError(j.error || "Something went wrong. Try again.");
        setBusy(false);
        return;
      }
      const u = j.user as { role: string };
      window.location.href = next || (u.role === "client" ? "/dashboard" : "/admin");
    } catch {
      setError("Could not reach the server. Check your connection.");
      setBusy(false);
    }
  }

  return (
    <form className="authform af" onSubmit={submit} noValidate>
      {register && (
        <div className="field">
          <label htmlFor={`${uid}-name`}><span>Full name</span></label>
          <input id={`${uid}-name`} name="name" autoComplete="name" value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} onBlur={() => touch("name")} aria-invalid={!!show("name")} required />
          {show("name") && <small className="field-err" role="alert">{show("name")}</small>}
        </div>
      )}
      <div className="field">
        <label htmlFor={`${uid}-email`}><span>Email</span></label>
        <input id={`${uid}-email`} name="email" type="email" inputMode="email" autoComplete="email" autoCapitalize="none" value={v.email} onChange={(e) => setV({ ...v, email: e.target.value })} onBlur={() => touch("email")} aria-invalid={!!show("email")} required />
        {show("email") && <small className="field-err" role="alert">{show("email")}</small>}
      </div>

      {register && (
        <>
          <div className="field">
            <label htmlFor={`${uid}-country`}><span>Where do you live?</span></label>
            <CountrySelect
              id={`${uid}-country`}
              label="Country you live in"
              value={country}
              onChange={(c) => {
                setCountry(c.code);
                if (!phoneOwn) setPhone((p) => ({ ...p, iso: c.code }));
              }}
            />
            <small>Helps the Kolé team plan a video tour at a good hour for you.</small>
          </div>
          <PhoneField
            value={phone}
            optional
            onChange={(x) => { if (x.iso !== phone.iso) setPhoneOwn(true); setPhone(x); }}
            onBlur={() => touch("phone")}
            error={show("phone")}
          />
        </>
      )}

      <div className="field">
        <label htmlFor={`${uid}-pw`}><span>Password</span></label>
        <PasswordInput id={`${uid}-pw`} value={v.password} onChange={(x) => setV({ ...v, password: x })} onBlur={() => touch("password")} autoComplete={register ? "new-password" : "current-password"} invalid={!!show("password")} />
        {register && (
          <div className="pw-meter" aria-live="polite">
            <span className="pw-bars" data-score={pw.score} aria-hidden="true"><i /><i /><i /><i /></span>
            <small>{v.password ? pw.label : "At least 8 characters. A longer phrase is stronger."}</small>
          </div>
        )}
        {show("password") && <small className="field-err" role="alert">{show("password")}</small>}
      </div>
      {!register && <p className="form-alt"><Link href="/forgot-password">Forgot your password?</Link></p>}

      {error && <p className="form-error form-error big" role="alert">{error}</p>}

      <button className="btn solid wide" type="submit" disabled={busy}>
        {busy ? <><span className="spin" aria-hidden="true" /> Please wait…</> : register ? "Create account" : "Log in"}
      </button>
      {register && <p className="form-fine">Buyer accounts are free. We only use your details to answer your questions and arrange tours.</p>}
      <p className="form-alt">
        {register ? (
          <>
            Already have an account? <Link href={`/login${nextQs}`}>Log in</Link>
          </>
        ) : (
          <>
            New here? <Link href={`/register${nextQs}`}>Create an account</Link>
          </>
        )}
      </p>
    </form>
  );
}
