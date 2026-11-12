"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

/** A heart that adds a property to the client's shortlist. Signed-out visitors are sent to log in first. */
export default function SaveButton({ propertyId, saved, label = false }: { propertyId: string; saved: boolean; label?: boolean }) {
  const router = useRouter();
  const path = usePathname();
  const [on, setOn] = useState(saved);
  const [busy, setBusy] = useState(false);

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;
    const next = !on;
    setOn(next);
    setBusy(true);
    try {
      const r = await fetch("/api/saved", {
        method: next ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId }),
      });
      if (r.status === 401) {
        setOn(!next);
        const here = path + (typeof window !== "undefined" ? window.location.search : "");
        router.push(`/login?next=${encodeURIComponent(here)}&why=save`);
        return;
      }
      if (!r.ok) setOn(!next);
      else router.refresh();
    } catch {
      setOn(!next);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button type="button" className={`save${on ? " on" : ""}${label ? " with-label" : ""}`} aria-pressed={on} aria-label={on ? "Remove from my saved properties" : "Save this property"} onClick={toggle}>
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
        <path d="M12 21s-7.5-4.6-9.6-9.2C1 8.6 2.9 5 6.4 5c2 0 3.6 1.1 4.6 2.7h2C14 6.1 15.6 5 17.6 5c3.5 0 5.4 3.6 4 6.8C19.5 16.4 12 21 12 21z" fill={on ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
      {label && <span>{on ? "Saved" : "Save"}</span>}
    </button>
  );
}
