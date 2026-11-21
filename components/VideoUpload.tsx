"use client";

import { useEffect, useState } from "react";
import type { PropertyVideo } from "@/lib/types";

type Caps = { mode: "supabase" | "server" | "none"; maxMb: number };

/** Grabs a still frame from the video in the browser, to use as its cover. */
async function frame(file: File): Promise<Blob | null> {
  const url = URL.createObjectURL(file);
  try {
    const v = document.createElement("video");
    v.muted = true;
    v.playsInline = true;
    v.preload = "auto";
    v.src = url;
    await new Promise<void>((res, rej) => {
      v.onloadeddata = () => res();
      v.onerror = () => rej(new Error("decode"));
      setTimeout(() => rej(new Error("timeout")), 15000);
    });
    v.currentTime = Math.min(1.5, (v.duration || 2) / 3);
    await new Promise<void>((res) => { v.onseeked = () => res(); setTimeout(res, 4000); });
    const k = Math.min(1, 1280 / Math.max(v.videoWidth, 1));
    const c = document.createElement("canvas");
    c.width = Math.round(v.videoWidth * k);
    c.height = Math.round(v.videoHeight * k);
    c.getContext("2d")!.drawImage(v, 0, 0, c.width, c.height);
    return await new Promise<Blob | null>((res) => c.toBlob(res, "image/jpeg", 0.85));
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function sendWithProgress(method: string, url: string, body: XMLHttpRequestBodyInit, onPct: (n: number) => void, headers: Record<string, string> = {}): Promise<{ status: number; text: string }> {
  return new Promise((res, rej) => {
    const x = new XMLHttpRequest();
    x.open(method, url);
    for (const [k, v] of Object.entries(headers)) x.setRequestHeader(k, v);
    x.upload.onprogress = (e) => e.lengthComputable && onPct(Math.round((e.loaded / e.total) * 100));
    x.onload = () => res({ status: x.status, text: x.responseText });
    x.onerror = () => rej(new Error("network"));
    x.send(body);
  });
}

/** Upload up to four walk-through videos. Big files go straight to Supabase Storage so Vercel's request limit never applies. */
export default function VideoUpload({ videos, onChange }: { videos: PropertyVideo[]; onChange: (v: PropertyVideo[]) => void }) {
  const [caps, setCaps] = useState<Caps | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/upload/video").then((r) => r.json()).then((j) => setCaps(j)).catch(() => setCaps({ mode: "none", maxMb: 50 }));
  }, []);

  async function pick(files: FileList | null) {
    const f = files?.[0];
    if (!f || !caps) return;
    setError(null);
    if (!/^video\/(mp4|webm|quicktime)$/.test(f.type)) return setError("Choose an MP4, WebM or MOV video.");
    if (f.size > caps.maxMb * 1048576) return setError(`That video is ${(f.size / 1048576).toFixed(0)} MB. The limit is ${caps.maxMb} MB. Export it as 1080p MP4 (H.264) and try again.`);
    try {
      setBusy("Preparing…");
      let url = "";
      if (caps.mode === "supabase") {
        const r = await fetch("/api/upload/video", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ type: f.type, size: f.size }) });
        const j = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(j.error || "Could not start the upload.");
        const fd = new FormData();
        fd.append("cacheControl", "31536000");
        fd.append("", f);
        const up = await sendWithProgress("PUT", j.uploadUrl, fd, (n) => setBusy(`Uploading video… ${n}%`), { "x-upsert": "false" });
        if (up.status >= 300) throw new Error("Supabase refused the video: " + up.text.slice(0, 120));
        url = j.url;
      } else {
        const fd = new FormData();
        fd.append("file", f);
        const up = await sendWithProgress("POST", "/api/upload/video", fd, (n) => setBusy(`Uploading video… ${n}%`));
        const j = JSON.parse(up.text || "{}");
        if (up.status >= 300) throw new Error(j.error || "Upload failed.");
        url = j.url;
      }
      setBusy("Making the cover image…");
      let poster: string | undefined;
      const blob = await frame(f);
      if (blob) {
        const fd = new FormData();
        fd.append("file", new File([blob], "cover.jpg", { type: "image/jpeg" }));
        const r = await fetch("/api/upload", { method: "POST", body: fd });
        const j = await r.json().catch(() => ({}));
        if (r.ok) poster = j.url;
      }
      onChange([...videos, { url, poster, title: f.name.replace(/\.[^.]+$/, "").slice(0, 60) }]);
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(null);
  }

  return (
    <fieldset>
      <legend>Videos (optional)</legend>
      <p className="form-note">
        Add up to 4 walk-through videos. Use the original export: MP4 (H.264), 1080p or higher, landscape. Clients play them in full quality on the listing and in the app. Limit {caps?.maxMb ?? 50} MB each.
      </p>
      {caps?.mode === "none" && (
        <p className="notice">Video upload is switched off on this server. Connect Supabase Storage (set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY) and it turns on.</p>
      )}
      {videos.length > 0 && (
        <div className="vid-list">
          {videos.map((v, i) => (
            <div key={v.url} className="vid-item">
              <video src={v.url} poster={v.poster} controls preload="metadata" playsInline />
              <input value={v.title ?? ""} maxLength={80} aria-label="Video title" placeholder="Title, e.g. Living room walk-through" onChange={(e) => onChange(videos.map((x, k) => (k === i ? { ...x, title: e.target.value } : x)))} />
              <button type="button" className="linkbtn" onClick={() => onChange(videos.filter((_, k) => k !== i))}>Remove</button>
            </div>
          ))}
        </div>
      )}
      {error && <p className="form-error" role="alert">{error}</p>}
      <label className="btn plain filebtn">
        {busy ?? "Upload a video"}
        <input type="file" accept="video/mp4,video/webm,video/quicktime" disabled={!!busy || videos.length >= 4 || !caps || caps.mode === "none"} onChange={(e) => { pick(e.target.files); e.target.value = ""; }} />
      </label>
    </fieldset>
  );
}
