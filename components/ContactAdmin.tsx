"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ContactAdminRow({ id, handled }: { id: string; handled: boolean }) {
  const r = useRouter();
  const [busy, setBusy] = useState(false);
  async function call(method: string, body?: object) {
    setBusy(true);
    await fetch(`/api/admin/contact/${id}`, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
    setBusy(false);
    r.refresh();
  }
  return (
    <div className="req-actions">
      <button type="button" className="btn plain small" disabled={busy} onClick={() => call("PATCH", { handled: !handled })}>{handled ? "Reopen" : "Mark handled"}</button>
      <button type="button" className="linkbtn" disabled={busy} onClick={() => call("DELETE")}>Delete</button>
    </div>
  );
}
