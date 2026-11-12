"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { DEV_TYPES, type DevType } from "@/lib/devtypes";

export interface DevFormValues {
  id?: string;
  company: string;
  devType: DevType | "";
  about: string;
  rcNumber: string;
  contactName: string;
  phone: string;
  contactEmail: string;
  verified: boolean;
}
export const emptyDev: DevFormValues = { company: "", devType: "", about: "", rcNumber: "", contactName: "", phone: "", contactEmail: "", verified: false };

/** Add or edit a developer the Kolé team works with. Contact details here are private to the team. */
export function DeveloperForm({ initial, onDone }: { initial?: DevFormValues; onDone?: () => void }) {
  const router = useRouter();
  const [v, setV] = useState<DevFormValues>(initial ?? emptyDev);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof DevFormValues, val: string | boolean) => setV((cur) => ({ ...cur, [k]: val }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const r = await fetch(v.id ? `/api/admin/developers/${v.id}` : "/api/admin/developers", {
        method: v.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(v),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) setError(j.error || "Could not save.");
      else {
        if (!v.id) setV(emptyDev);
        router.refresh();
        onDone?.();
      }
    } catch {
      setError("Connection problem.");
    }
    setBusy(false);
  }

  return (
    <form className="devform" onSubmit={submit}>
      <div className="fgrid two">
        <label className="field">
          <span>Company name</span>
          <input value={v.company} onChange={(e) => set("company", e.target.value)} maxLength={80} required />
        </label>
        <label className="field">
          <span>Kind of developer</span>
          <select value={v.devType} onChange={(e) => set("devType", e.target.value)} required>
            <option value="" disabled>
              Choose one
            </option>
            {DEV_TYPES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>CAC registration number (optional)</span>
          <input value={v.rcNumber} onChange={(e) => set("rcNumber", e.target.value)} placeholder="RC 1234567" maxLength={20} />
        </label>
        <label className="field">
          <span>Contact person (private)</span>
          <input value={v.contactName} onChange={(e) => set("contactName", e.target.value)} maxLength={80} />
        </label>
        <label className="field">
          <span>Phone (private)</span>
          <input value={v.phone} onChange={(e) => set("phone", e.target.value)} maxLength={30} />
        </label>
        <label className="field">
          <span>Email (private)</span>
          <input type="email" value={v.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} maxLength={120} />
        </label>
      </div>
      <label className="field">
        <span>About the developer (shown to buyers)</span>
        <textarea rows={3} value={v.about} onChange={(e) => set("about", e.target.value)} maxLength={600} placeholder="Years in business, estates delivered, what they build." />
      </label>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="acts">
        <button className="btn solid small" type="submit" disabled={busy}>
          {busy ? "Saving…" : v.id ? "Save changes" : "Add developer"}
        </button>
        {onDone && (
          <button type="button" className="btn plain small" onClick={onDone}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

export function DeveloperRow({ values, listings }: { values: DevFormValues; listings: number }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function call(method: string, body?: unknown) {
    setBusy(true);
    setError(null);
    try {
      const r = await fetch(`/api/admin/developers/${values.id}`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!r.ok) setError((await r.json().catch(() => ({}))).error || "Could not update.");
      else router.refresh();
    } catch {
      setError("Connection problem.");
    }
    setBusy(false);
    setConfirm(false);
  }

  if (editing) return <DeveloperForm initial={values} onDone={() => setEditing(false)} />;
  return (
    <div className="acts">
      <button type="button" className="btn plain small" disabled={busy} onClick={() => call("PATCH", { verified: !values.verified })} title="Tick a developer once you have checked their CAC registration and a past project">
        {values.verified ? "✓ Verified" : "Mark verified"}
      </button>
      <button type="button" className="btn plain small" onClick={() => setEditing(true)}>
        Edit
      </button>
      {confirm ? (
        <>
          <button type="button" className="btn danger small" disabled={busy} onClick={() => call("DELETE")}>
            Yes, remove
          </button>
          <button type="button" className="btn plain small" onClick={() => setConfirm(false)}>
            Keep
          </button>
        </>
      ) : (
        <button type="button" className="btn plain small" disabled={listings > 0} title={listings > 0 ? "Remove or move their listings first" : undefined} onClick={() => setConfirm(true)}>
          Remove
        </button>
      )}
      {error && <span className="form-error">{error}</span>}
    </div>
  );
}

export function RequestRow({ id, handled }: { id: string; handled: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function call(method: string, body?: unknown) {
    setBusy(true);
    try {
      await fetch(`/api/admin/partner-requests/${id}`, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
      router.refresh();
    } catch {
      /* the list stays as it was */
    }
    setBusy(false);
  }
  return (
    <div className="acts">
      <button type="button" className="btn plain small" disabled={busy} onClick={() => call("PATCH", { handled: !handled })}>
        {handled ? "Reopen" : "Mark handled"}
      </button>
      <button type="button" className="btn plain small" disabled={busy} onClick={() => call("DELETE")}>
        Delete
      </button>
    </div>
  );
}
