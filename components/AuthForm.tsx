"use client";

import Link from "next/link";
import { useState } from "react";

interface Props {
  mode: "login" | "register";
  next?: string;
}

export default function AuthForm({ mode, next }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const register = mode === "register";
  const nextQs = next ? `?next=${encodeURIComponent(next)}` : "";

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const f = new FormData(e.currentTarget);
    const payload: Record<string, unknown> = { email: f.get("email"), password: f.get("password") };
    if (register) {
      payload.name = f.get("name");
      payload.role = "client";
      payload.phone = f.get("phone");
      payload.country = f.get("country");
    }
    try {
      const r = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
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
    <form className="authform" onSubmit={submit} noValidate>
      {register && (
        <label className="field">
          <span>Full name</span>
          <input name="name" autoComplete="name" required />
        </label>
      )}
      {register && (
        <label className="field">
          <span>Where do you live? (optional)</span>
          <input name="country" placeholder="e.g. London, UK or Lagos" autoComplete="country-name" />
          <small>Helps the Kolé team plan a video tour at a sensible hour for you.</small>
        </label>
      )}
      <label className="field">
        <span>Email</span>
        <input name="email" type="email" autoComplete="email" required />
      </label>
      {register && (
        <label className="field">
          <span>Phone (optional)</span>
          <input name="phone" type="tel" autoComplete="tel" />
        </label>
      )}
      <label className="field">
        <span>Password</span>
        <input name="password" type="password" autoComplete={register ? "new-password" : "current-password"} minLength={register ? 8 : undefined} required />
        {register && <small>At least 8 characters.</small>}
      </label>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <button className="btn solid wide" type="submit" disabled={busy}>
        {busy ? "Please wait…" : register ? "Create account" : "Log in"}
      </button>
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
