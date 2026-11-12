"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatMessage } from "@/lib/types";
import { clock } from "@/lib/format";
import Photo from "./Photo";

interface View {
  property: { id: string; title: string; photo: string; area: string; developerName: string };
  counterpart: string;
  counterpartNote?: string;
  team: { id: string; name: string; focus: string } | null;
  canAssign?: boolean;
  teams?: { id: string; name: string }[];
  messages: ChatMessage[];
}

interface Props {
  threadId: string;
  viewer: "client" | "staff";
  suggestions?: string[];
  compact?: boolean;
}

export default function Conversation({ threadId, viewer, suggestions = [], compact = false }: Props) {
  const [view, setView] = useState<View | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const r = await fetch(`/api/chat/threads/${threadId}`, { cache: "no-store" });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        setError(j.error || "Could not load this conversation.");
        return;
      }
      setView(j);
      setError(null);
    } catch {
      setError("Connection lost. Retrying…");
    }
  }, [threadId]);

  useEffect(() => {
    setView(null);
    load();
    const t = setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, 3500);
    return () => clearInterval(t);
  }, [load]);

  const count = view?.messages.length ?? 0;
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [count, threadId]);

  async function assign(teamId: string) {
    setError(null);
    try {
      const r = await fetch(`/api/chat/threads/${threadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) setError(j.error || "Could not move this conversation.");
      else setView(j);
    } catch {
      setError("Could not move this conversation.");
    }
  }

  async function send(body: string) {
    const b = body.trim();
    if (!b || sending) return;
    setSending(true);
    setError(null);
    try {
      const r = await fetch(`/api/chat/threads/${threadId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: b }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        setError(j.error || "Message not sent.");
        return;
      }
      setView(j);
      setText("");
    } catch {
      setError("Message not sent. Check your connection.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className={`convo${compact ? " compact" : ""}`}>
      {view && !compact && (
        <div className="convo-head">
          <span className="ch-photo">
            <Photo photo={{ src: view.property.photo, alt: "" }} sizes="64px" />
          </span>
          <div>
            <Link href={`/properties/${view.property.id}`} className="ch-title">
              {view.property.title}
            </Link>
            <p>
              {view.property.area} · {viewer === "client" ? view.counterpart : `Client: ${view.counterpart}${view.counterpartNote ? ` (lives in ${view.counterpartNote})` : ""}`}
            </p>
          </div>
        </div>
      )}

      {view && viewer === "client" && (
        <div className="convo-team">
          {view.team ? (
            <>
              <span className="team-badge">{view.team.name}</span>
              <span className="muted">{view.team.focus ? `${view.team.focus}. ` : ""}This team is attending to you.</span>
            </>
          ) : (
            <span className="muted">The Kolé team will pick this up shortly.</span>
          )}
        </div>
      )}
      {view && !compact && viewer === "staff" && (
        <div className="convo-team">
          {view.canAssign ? (
            <label>
              Attended by{" "}
              <select value={view.team?.id ?? ""} onChange={(e) => assign(e.target.value)}>
                <option value="">No team yet</option>
                {view.teams?.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </label>
          ) : (
            <span>Attended by <span className="team-badge">{view.team?.name ?? "Kolé team"}</span></span>
          )}
        </div>
      )}

      <div className="convo-list" ref={listRef} aria-live="polite">
        {!view && !error && <p className="convo-note">Loading messages…</p>}
        {view && view.messages.length === 0 && (
          <p className="convo-note">
            {viewer === "client"
              ? `Ask ${view.team?.name ?? view.counterpart} about price, payment plan, documents or an inspection.`
              : "No messages yet."}
          </p>
        )}
        {view?.messages.map((m) => {
          const mine = m.senderRole === viewer;
          return (
            <div key={m.id} className={`bubble${mine ? " mine" : ""}`}>
              {!mine && (
                <span className="b-name">
                  {m.senderName}
                  {m.senderRole === "staff" && m.teamName && <span className="b-team"> · {m.teamName}</span>}
                </span>
              )}
              <p>{m.body}</p>
              <span className="b-time">{clock(m.createdAt)}</span>
            </div>
          );
        })}
      </div>

      {viewer === "client" && view && view.messages.length === 0 && suggestions.length > 0 && (
        <div className="suggest">
          {suggestions.map((s) => (
            <button key={s} type="button" className="chip" onClick={() => send(s)} disabled={sending}>
              {s}
            </button>
          ))}
        </div>
      )}

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <form
        className="convo-form"
        onSubmit={(e) => {
          e.preventDefault();
          send(text);
        }}
      >
        <textarea
          id={`msg-${threadId}`}
          aria-label="Your message"
          rows={1}
          value={text}
          maxLength={2000}
          placeholder="Write a message…"
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(text);
            }
          }}
        />
        <button className="btn solid" type="submit" disabled={sending || !text.trim() || !view}>
          Send
        </button>
      </form>
    </div>
  );
}
