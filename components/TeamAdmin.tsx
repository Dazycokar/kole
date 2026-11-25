"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

async function call(url: string, method: string, body?: unknown): Promise<string | null> {
  try {
    const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
    if (r.ok) return null;
    const j = await r.json().catch(() => ({}));
    return j.error || "Something went wrong.";
  } catch {
    return "Connection problem.";
  }
}

export function NewTeamForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [focus, setFocus] = useState("");
  const [areas, setAreas] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const m = await call("/api/admin/teams", "POST", { name, focus, areas });
    setError(m);
    if (!m) {
      setName(""); setFocus(""); setAreas("");
      router.refresh();
    }
    setBusy(false);
  }
  return (
    <form className="devform" onSubmit={submit}>
      <div className="fgrid two">
        <label className="field">
          <span>Team name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={50} placeholder="Ikoyi Desk" required />
        </label>
        <label className="field">
          <span>What they handle (clients see this)</span>
          <input value={focus} onChange={(e) => setFocus(e.target.value)} maxLength={120} placeholder="Ikoyi and Lagos Island homes" />
        </label>
        <label className="field" style={{ gridColumn: "1 / -1" }}>
          <span>Areas or cities they cover, separated by commas (new enquiries about these go to this team)</span>
          <input value={areas} onChange={(e) => setAreas(e.target.value)} maxLength={200} placeholder="Ikoyi, Victoria Island, Lagos Island" />
        </label>
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="btn solid" type="submit" disabled={busy}>{busy ? "Adding…" : "Add team"}</button>
    </form>
  );
}

export function NewAgentForm({ teamId }: { teamId: string }) {
  const router = useRouter();
  const [v, setV] = useState({ name: "", email: "", password: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const m = await call("/api/admin/agents", "POST", { ...v, teamId });
    setError(m);
    if (!m) {
      setV({ name: "", email: "", password: "" });
      router.refresh();
    }
    setBusy(false);
  }
  return (
    <form className="devform" onSubmit={submit}>
      <div className="fgrid two">
        <label className="field">
          <span>Name</span>
          <input value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} maxLength={80} required />
        </label>
        <label className="field">
          <span>Email (their login)</span>
          <input type="email" value={v.email} onChange={(e) => setV({ ...v, email: e.target.value })} maxLength={120} required />
        </label>
        <label className="field">
          <span>Password (min 8 characters)</span>
          <input type="text" autoComplete="off" value={v.password} onChange={(e) => setV({ ...v, password: e.target.value })} minLength={8} maxLength={128} required />
        </label>
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="btn plain" type="submit" disabled={busy}>{busy ? "Adding…" : "Add team member"}</button>
    </form>
  );
}

export function TeamActions({ id, name, canDelete }: { id: string; name: string; canDelete: boolean }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  async function rename() {
    const n = window.prompt("New team name", name);
    if (!n || n.trim() === name) return;
    const m = await call(`/api/admin/teams/${id}`, "PATCH", { name: n });
    setError(m);
    if (!m) router.refresh();
  }
  async function remove() {
    const m = await call(`/api/admin/teams/${id}`, "DELETE");
    setError(m);
    setConfirm(false);
    if (!m) router.refresh();
  }
  return (
    <span className="row-actions">
      <button type="button" className="btn plain small" onClick={rename}>Rename</button>
      {confirm ? (
        <>
          <button type="button" className="btn solid small" onClick={remove}>Yes, delete</button>
          <button type="button" className="btn plain small" onClick={() => setConfirm(false)}>Cancel</button>
        </>
      ) : (
        <button type="button" className="btn plain small" onClick={() => setConfirm(true)} disabled={!canDelete} title={canDelete ? "" : "Remove the team's members first"}>Delete</button>
      )}
      {error && <span className="form-error" role="alert">{error}</span>}
    </span>
  );
}

export function AgentActions({ id, status, teams, teamId }: { id: string; status: string; teams: { id: string; name: string }[]; teamId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  async function patch(body: unknown) {
    const m = await call(`/api/admin/agents/${id}`, "PATCH", body);
    setError(m);
    if (!m) router.refresh();
  }
  async function remove() {
    const m = await call(`/api/admin/agents/${id}`, "DELETE");
    setError(m);
    setConfirm(false);
    if (!m) router.refresh();
  }
  return (
    <span className="row-actions">
      <select aria-label="Move to team" value={teamId} onChange={(e) => patch({ teamId: e.target.value })}>
        {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
      </select>
      <button type="button" className="btn plain small" onClick={() => patch({ status: status === "active" ? "suspended" : "active" })}>
        {status === "active" ? "Suspend" : "Reactivate"}
      </button>
      <button type="button" className="btn plain small" onClick={() => { const p = window.prompt("New password (min 8 characters)"); if (p) patch({ password: p }); }}>Reset password</button>
      {confirm ? (
        <>
          <button type="button" className="btn solid small" onClick={remove}>Yes, remove</button>
          <button type="button" className="btn plain small" onClick={() => setConfirm(false)}>Cancel</button>
        </>
      ) : (
        <button type="button" className="btn plain small" onClick={() => setConfirm(true)}>Remove</button>
      )}
      {error && <span className="form-error" role="alert">{error}</span>}
    </span>
  );
}
