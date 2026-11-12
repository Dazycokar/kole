"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Property } from "@/lib/types";
import { nairaShort, purposeLabel } from "@/lib/format";
import Photo from "./Photo";

export default function ListingRow({ p, isAdmin, interest = 0 }: { p: Property; isAdmin: boolean; interest?: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function patch(body: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    try {
      const r = await fetch(`/api/admin/properties/${p.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) setError((await r.json().catch(() => ({}))).error || "Could not save.");
      else router.refresh();
    } catch {
      setError("Connection problem.");
    }
    setBusy(false);
  }

  async function remove() {
    setBusy(true);
    setError(null);
    try {
      const r = await fetch(`/api/admin/properties/${p.id}`, { method: "DELETE" });
      if (!r.ok) setError((await r.json().catch(() => ({}))).error || "Could not delete.");
      else router.refresh();
    } catch {
      setError("Connection problem.");
    }
    setBusy(false);
    setConfirm(false);
  }

  return (
    <tr className={busy ? "busy" : undefined}>
      <td>
        <div className="lr-main">
          <span className="lr-photo">
            <Photo photo={{ src: p.photos[0] ?? "", alt: "" }} sizes="80px" />
          </span>
          <div>
            <Link href={`/properties/${p.id}`} className="lr-title">
              {p.title}
            </Link>
            <p>
              {p.area}, {p.city} · {p.type === "land" ? "Land" : p.subtype || "House"}
              {p.demo ? " · Sample" : ""}
              {interest > 0 ? ` · ♥ ${interest} saved` : ""}
            </p>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
          </div>
        </div>
      </td>
      <td className="num">
        {nairaShort(p.price)}
        <small>{purposeLabel(p)}</small>
      </td>
      <td>
        <select aria-label={`Availability of ${p.title}`} value={p.status} disabled={busy} onChange={(e) => patch({ status: e.target.value })}>
          <option value="available">Available</option>
          <option value="reserved">Reserved</option>
          <option value="sold">{p.purpose === "rent" ? "Let" : "Sold"}</option>
        </select>
      </td>
      <td>
        <button type="button" className={`switch${p.published ? " on" : ""}`} aria-pressed={p.published} disabled={busy} onClick={() => patch({ published: !p.published })}>
          {p.published ? "Live" : "Hidden"}
        </button>
        {isAdmin && (
          <button type="button" className={`switch star${p.featured ? " on" : ""}`} aria-pressed={p.featured} disabled={busy} onClick={() => patch({ featured: !p.featured })} title="Feature on the home page">
            {p.featured ? "★ Featured" : "☆ Feature"}
          </button>
        )}
        {isAdmin && (
          <button type="button" className={`switch star${p.verified ? " on" : ""}`} aria-pressed={!!p.verified} disabled={busy} onClick={() => patch({ verified: !p.verified })} title="Mark when you have seen the title documents">
            {p.verified ? "✓ Docs checked" : "Mark docs checked"}
          </button>
        )}
      </td>
      <td>
        <div className="acts">
        <Link href={`/admin/properties/${p.id}`} className="btn plain small">
          Edit
        </Link>
        {confirm ? (
          <>
            <button type="button" className="btn danger small" disabled={busy} onClick={remove}>
              Yes, delete
            </button>
            <button type="button" className="btn plain small" onClick={() => setConfirm(false)}>
              Keep
            </button>
          </>
        ) : (
          <button type="button" className="btn plain small" onClick={() => setConfirm(true)}>
            Delete
          </button>
        )}
        </div>
      </td>
    </tr>
  );
}
