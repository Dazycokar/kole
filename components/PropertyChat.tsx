"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Conversation from "./Conversation";

interface Props {
  propertyId: string;
  viewer: { role: "client" | "developer" | "admin" | "agent"; name: string } | null;
}

const SUGGESTIONS = [
  "Is this still available?",
  "Can we do a live video tour?",
  "Please share copies of the title documents.",
  "What are the payment terms?",
  "Is payment held by a lawyer or in escrow?",
];

/** The "Ask about this property" box on a listing page. */
export default function PropertyChat({ propertyId, viewer }: Props) {
  const [threadId, setThreadId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const next = encodeURIComponent(`/properties/${propertyId}`);

  useEffect(() => {
    if (viewer?.role !== "client") return;
    let live = true;
    fetch("/api/chat/threads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ propertyId }),
    })
      .then(async (r) => {
        const j = await r.json().catch(() => ({}));
        if (!live) return;
        if (r.ok) setThreadId(j.threadId);
        else setError(j.error || "Could not open the chat.");
      })
      .catch(() => live && setError("Could not open the chat. Check your connection."));
    return () => {
      live = false;
    };
  }, [propertyId, viewer?.role]);

  if (!viewer) {
    return (
      <div className="askbox">
        <h3>Ask Kolé about this property</h3>
        <p>Create a free buyer account to ask the Kolé team about price, payment plans and documents, or to book an inspection or a live video tour. Replies show up here and in your dashboard.</p>
        <div className="cta">
          <Link className="btn solid" href={`/login?next=${next}`}>
            Log in to chat
          </Link>
          <Link className="btn plain" href={`/register?next=${next}`}>
            Create buyer account
          </Link>
        </div>
      </div>
    );
  }

  if (viewer.role !== "client") {
    return (
      <div className="askbox">
        <h3>You are signed in as the Kolé team</h3>
        <p>Buyer enquiries arrive in your messages inbox.</p>
        <Link className="btn plain" href="/admin/messages">
          Open messages
        </Link>
      </div>
    );
  }

  return (
    <div className="askbox chat">
      <h3>Ask Kolé about this property</h3>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {!threadId && !error && <p className="convo-note">Opening chat…</p>}
      {threadId && <Conversation threadId={threadId} viewer="client" suggestions={SUGGESTIONS} compact />}
    </div>
  );
}
