"use client";

import Link from "next/link";
import { useId, useState } from "react";

interface Props {
  mode: "request" | "reset";
  token?: string;
}

export default function PasswordResetForm({ mode, token }: Props) {
  const uid = useId();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (mode === "reset" && password !== confirm) {
      setError("The passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      const r = await fetch(`/api/auth/${mode === "request" ? "forgot-password" : "reset-password"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mode === "request" ? { email } : { token, password }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        setError(j.error || "Something went wrong. Please try again.");
        return;
      }
      if (mode === "request") setSent(true);
      else setDone(true);
    } catch {
      setError("Could not reach the server. Check your connection.");
    } finally {
      setBusy(false);
    }
  }

  if (mode === "reset" && !token) {
    return (
      <div className="authform">
        <p className="form-error" role="alert">This reset link is incomplete. Request a new one to continue.</p>
        <Link className="btn solid wide" href="/forgot-password">Request a reset link</Link>
      </div>
    );
  }

  if (sent || done) {
    return (
      <div className="authform">
        <p className="form-note" role="status">
          {sent
            ? "If that email belongs to a client account, reset instructions will be sent if email delivery is available."
            : "Your password has been changed. Please log in with your new password."}
        </p>
        {done && <Link className="btn solid wide" href="/login">Go to log in</Link>}
        {sent && <Link className="form-alt" href="/login">Back to log in</Link>}
      </div>
    );
  }

  return (
    <form className="authform" onSubmit={submit}>
      {mode === "request" ? (
        <div className="field">
          <label htmlFor={`${uid}-email`}>Email</label>
          <input
            id={`${uid}-email`}
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
      ) : (
        <>
          <div className="field">
            <label htmlFor={`${uid}-password`}>New password</label>
            <input
              id={`${uid}-password`}
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              maxLength={128}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <small>Use at least 8 characters.</small>
          </div>
          <div className="field">
            <label htmlFor={`${uid}-confirm`}>Confirm new password</label>
            <input
              id={`${uid}-confirm`}
              name="confirm-password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              maxLength={128}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
          </div>
        </>
      )}

      {error && <p className="form-error form-error big" role="alert">{error}</p>}
      <button className="btn solid wide" type="submit" disabled={busy}>
        {busy ? "Please wait…" : mode === "request" ? "Send reset link" : "Set new password"}
      </button>
      <p className="form-alt"><Link href="/login">Back to log in</Link></p>
    </form>
  );
}
