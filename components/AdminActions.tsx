"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function RemoveSampleData({ count }: { count: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setError(null);
    try {
      const r = await fetch("/api/admin/demo", { method: "DELETE" });
      if (!r.ok) setError((await r.json().catch(() => ({}))).error || "Could not remove sample data.");
      else router.refresh();
    } catch {
      setError("Connection problem.");
    }
    setBusy(false);
    setConfirm(false);
  }

  return (
    <div className="sample-note">
      <p>
        <b>{count} sample listings</b> came with this install so you can see how the site looks. Remove them before you go live.
      </p>
      {confirm ? (
        <div className="acts">
          <button type="button" className="btn danger small" disabled={busy} onClick={run}>
            Yes, remove sample data
          </button>
          <button type="button" className="btn plain small" onClick={() => setConfirm(false)}>
            Keep
          </button>
        </div>
      ) : (
        <button type="button" className="btn plain small" onClick={() => setConfirm(true)}>
          Remove sample data
        </button>
      )}
      {error && <span className="form-error">{error}</span>}
    </div>
  );
}
