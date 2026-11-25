"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LogoutButton({ name, className = "pill-btn" }: { name: string; className?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function out() {
    setBusy(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      window.location.href = "/";
    }
    router.refresh();
  }

  return (
    <button type="button" className={className} onClick={out} disabled={busy} title={`Signed in as ${name}`}>
      Log out
    </button>
  );
}
