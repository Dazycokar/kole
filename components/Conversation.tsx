"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Attachment, ChatMessage } from "@/lib/types";
import { clock } from "@/lib/format";
import Photo from "./Photo";

interface View {
  property: { id: string; title: string; photo: string; area: string; developerName: string };
  counterpart: string;
  counterpartNote?: string;
  team: { id: string; name: string; focus: string; online?: boolean } | null;
  canAssign?: boolean;
  teams?: { id: string; name: string }[];
  messages: ChatMessage[];
}

type Pending = Attachment & { sig: string };
const ACCEPT = "image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv";
const size = (n: number) => (n >= 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

/** Phone photos are big; shrink them before sending so they fit under the host's upload limit. */
async function shrinkImage(file: File, limit = 3.4 * 1024 * 1024): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif" || file.size <= limit) return file;
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, 2200 / Math.max(bmp.width, bmp.height));
    const c = document.createElement("canvas");
    c.width = Math.round(bmp.width * scale);
    c.height = Math.round(bmp.height * scale);
    c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
    for (const q of [0.85, 0.75, 0.65, 0.55]) {
      const blob = await new Promise<Blob | null>((r) => c.toBlob(r, "image/jpeg", q));
      if (blob && blob.size <= limit) return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
    }
  } catch {
    /* let the server decide */
  }
  return file;
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
  const [pending, setPending] = useState<Pending[]>([]);
  const [uploading, setUploading] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
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

  async function pick(list: FileList | null) {
    if (!list?.length) return;
    const room = 5 - pending.length;
    const chosen = Array.from(list).slice(0, Math.max(0, room));
    if (list.length > room) setError("You can attach up to 5 files per message.");
    else setError(null);
    for (const f of chosen) {
      setUploading((n) => n + 1);
      try {
        const fd = new FormData();
        fd.append("file", await shrinkImage(f));
        const r = await fetch("/api/chat/upload", { method: "POST", body: fd });
        const j = await r.json().catch(() => ({}));
        if (!r.ok) setError(`${f.name}: ${j.error || "could not be uploaded."}`);
        else setPending((p) => [...p, j.attachment]);
      } catch {
        setError(`${f.name}: upload failed. Check your connection.`);
      } finally {
        setUploading((n) => n - 1);
      }
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  async function send(body: string) {
    const b = body.trim();
    if ((!b && !pending.length) || sending || uploading) return;
    setSending(true);
    setError(null);
    try {
      const r = await fetch(`/api/chat/threads/${threadId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: b, attachments: pending }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        setError(j.error || "Message not sent.");
        return;
      }
      setView(j);
      setText("");
      setPending([]);
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
              <span className={`presence${view.team.online ? " on" : ""}`}>{view.team.online ? "Online now" : "Offline, will reply when back"}</span>
              <span className="muted">{view.team.focus ? `${view.team.focus}.` : ""}</span>
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
            <div key={m.id} className={`bubble${mine ? " mine" : ""}${m.senderRole === "system" ? " auto" : ""}`}>
              {!mine && (
                <span className="b-name">
                  {m.senderRole === "system" && <span aria-hidden="true">✦ </span>}
                  {m.senderName}
                  {m.senderRole !== "client" && m.teamName && <span className="b-team"> · {m.teamName}</span>}
                </span>
              )}
              {m.body && <p>{m.body}</p>}
              {m.attachments && (
                <div className="b-files">
                  {m.attachments.map((a) =>
                    a.image ? (
                      <a key={a.file} href={a.url} target="_blank" rel="noopener noreferrer" className="b-img" aria-label={`Open ${a.name}`}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={a.url} alt={a.name} loading="lazy" />
                      </a>
                    ) : (
                      <a key={a.file} href={`${a.url}&name=${encodeURIComponent(a.name)}`} target="_blank" rel="noopener noreferrer" className="b-file">
                        <span className="b-ext">{a.name.split(".").pop()?.slice(0, 4)}</span>
                        <span className="b-fn"><b>{a.name}</b><small>{size(a.size)}</small></span>
                      </a>
                    ),
                  )}
                </div>
              )}
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

      {(pending.length > 0 || uploading > 0) && (
        <div className="pending">
          {pending.map((a) => (
            <span key={a.file} className="pchip">
              <span>{a.mime.startsWith("image/") ? "🖼" : "📄"} {a.name}</span>
              <button type="button" aria-label={`Remove ${a.name}`} onClick={() => setPending((p) => p.filter((x) => x.file !== a.file))}>×</button>
            </span>
          ))}
          {uploading > 0 && <span className="pchip busy">Uploading…</span>}
        </div>
      )}

      <form
        className="convo-form"
        onSubmit={(e) => {
          e.preventDefault();
          send(text);
        }}
      >
        <input ref={fileRef} type="file" hidden multiple accept={ACCEPT} onChange={(e) => pick(e.target.files)} />
        <button type="button" className="attach" aria-label="Attach photos or files" title="Attach photos, documents or files" onClick={() => fileRef.current?.click()} disabled={!view || pending.length >= 5}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m21 11-8.6 8.6a5.5 5.5 0 0 1-7.8-7.8l8.9-8.9a3.7 3.7 0 0 1 5.2 5.2l-8.9 8.9a1.8 1.8 0 0 1-2.6-2.6l8.2-8.2" /></svg>
        </button>
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
        <button className="btn solid" type="submit" disabled={sending || !!uploading || (!text.trim() && !pending.length) || !view}>
          Send
        </button>
      </form>
    </div>
  );
}
