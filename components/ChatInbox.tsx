"use client";

import { useCallback, useEffect, useState } from "react";
import type { ThreadSummary } from "@/lib/types";
import { timeAgo } from "@/lib/format";
import Conversation from "./Conversation";
import Photo from "./Photo";

interface Props {
  mode: "client" | "staff";
  initialThreadId?: string;
}

export default function ChatInbox({ mode, initialThreadId }: Props) {
  const [threads, setThreads] = useState<ThreadSummary[] | null>(null);
  const [selected, setSelected] = useState<string | null>(initialThreadId ?? null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/chat/threads", { cache: "no-store" });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        setError(j.error || "Could not load your messages.");
        return;
      }
      setThreads(j.threads);
      setError(null);
    } catch {
      setError("Connection lost. Retrying…");
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, 5000);
    return () => clearInterval(t);
  }, [load]);

  // On a wide screen, open the newest conversation straight away.
  useEffect(() => {
    if (!selected && threads?.length && window.matchMedia("(min-width: 900px)").matches) setSelected(threads[0].id);
  }, [threads, selected]);

  const current = threads?.find((t) => t.id === selected);

  return (
    <div className={`inbox${selected ? " has-selection" : ""}`}>
      <aside className="inbox-list" aria-label="Conversations">
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        {!threads && !error && <p className="convo-note">Loading…</p>}
        {threads && threads.length === 0 && (
          <div className="inbox-empty">
            <h3>No conversations yet</h3>
            <p>
              {mode === "client"
                ? "Open a property and use the chat box to ask about it. Your conversations will be listed here."
                : "When a client asks about one of your properties, the conversation appears here."}
            </p>
          </div>
        )}
        {threads?.map((t) => (
          <button
            key={t.id}
            type="button"
            className="thread"
            aria-current={t.id === selected}
            onClick={() => {
              setSelected(t.id);
              setThreads((list) => list && list.map((x) => (x.id === t.id ? { ...x, unread: 0 } : x)));
            }}
          >
            <span className="t-photo">
              <Photo photo={{ src: t.propertyPhoto, alt: "" }} sizes="64px" />
            </span>
            <span className="t-body">
              <span className="t-top">
                <b>{t.counterpart}</b>{t.counterpartNote && <small className="muted"> · {t.counterpartNote}</small>}
                <i>{t.lastMessage ? timeAgo(t.lastMessage.createdAt) : ""}</i>
              </span>
              <span className="t-prop">{t.propertyTitle}</span>
              {t.teamName ? <span className="team-badge">{t.teamName}</span> : mode === "staff" ? <span className="team-badge">No team yet</span> : null}
              <span className="t-last">
                {t.lastMessage ? `${t.lastMessage.mine ? "You: " : ""}${t.lastMessage.body}` : "No messages yet"}
              </span>
            </span>
            {t.unread > 0 && <span className="dot">{t.unread}</span>}
          </button>
        ))}
      </aside>

      <section className="inbox-pane" aria-label="Conversation">
        {selected && current ? (
          <>
            <button type="button" className="inbox-back btn plain" onClick={() => setSelected(null)}>
              ← All conversations
            </button>
            <Conversation key={selected} threadId={selected} viewer={mode} />
          </>
        ) : (
          <div className="inbox-empty">
            <h3>Select a conversation</h3>
            <p>Pick one from the list to read and reply.</p>
          </div>
        )}
      </section>
    </div>
  );
}
