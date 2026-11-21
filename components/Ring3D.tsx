"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent as RPointerEvent } from "react";
import { sized } from "@/lib/img";

/**
 * The 3D photo view. Big photos sit in a curved row in real 3D space with depth, reflections and a thumbnail strip.
 * Drag, swipe, use arrows or keys. Tap the front photo (or the Full screen button) for a full-screen viewer with zoom.
 */
export default function Ring3D({ photos, title }: { photos: string[]; title: string }) {
  const n = photos.length;
  const [active, setActive] = useState(0);
  const [drag, setDrag] = useState(0);
  const [auto, setAuto] = useState(true);
  const [hover, setHover] = useState(false);
  const [full, setFull] = useState(false);
  const [failed, setFailed] = useState<Record<number, boolean>>({});
  const stage = useRef<HTMLDivElement>(null);
  const strip = useRef<HTMLDivElement>(null);
  const start = useRef<{ x: number; id: number; moved: boolean } | null>(null);

  const go = useCallback((to: number) => setActive(((to % n) + n) % n), [n]);

  useEffect(() => {
    if (!auto || hover || full || n < 2) return;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setActive((a) => (a + 1) % n), 4800);
    return () => clearInterval(t);
  }, [auto, hover, full, n]);

  // Keep the active thumbnail in view.
  useEffect(() => {
    const el = strip.current?.children[active] as HTMLElement | undefined;
    if (el && strip.current) strip.current.scrollTo({ left: el.offsetLeft - strip.current.clientWidth / 2 + el.clientWidth / 2, behavior: "smooth" });
  }, [active]);

  function down(e: RPointerEvent<HTMLDivElement>) {
    start.current = { x: e.clientX, id: e.pointerId, moved: false };
    setAuto(false);
  }
  function move(e: RPointerEvent<HTMLDivElement>) {
    const s = start.current;
    const el = stage.current;
    if (el && e.pointerType === "mouse" && !s) {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--ty", `${(((e.clientX - r.left) / r.width) * 2 - 1) * 4}deg`);
      el.style.setProperty("--tx", `${(((e.clientY - r.top) / r.height) * 2 - 1) * -2.5}deg`);
    }
    if (!s) return;
    const w = el?.clientWidth ?? 600;
    const dx = e.clientX - s.x;
    if (Math.abs(dx) > 6 && !s.moved) {
      s.moved = true;
      el?.setPointerCapture(s.id);
    }
    if (s.moved) setDrag(-dx / (w * 0.4));
  }
  function up() {
    const s = start.current;
    start.current = null;
    if (s?.moved) {
      const step = Math.round(drag);
      if (step) go(active + step);
    }
    setDrag(0);
  }
  function leave() {
    setHover(false);
    const el = stage.current;
    if (el) {
      el.style.setProperty("--tx", "0deg");
      el.style.setProperty("--ty", "0deg");
    }
  }

  const off = (i: number) => {
    let d = i - active - drag;
    d = ((((d + n / 2) % n) + n) % n) - n / 2;
    return d;
  };

  return (
    <div
      className="r3d"
      tabIndex={0}
      role="group"
      aria-roledescription="carousel"
      aria-label={`${title} in 3D. Use the arrow keys to move, Enter for full screen.`}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") { setAuto(false); go(active + 1); }
        if (e.key === "ArrowLeft") { setAuto(false); go(active - 1); }
        if (e.key === "Enter" && e.target === e.currentTarget) setFull(true);
      }}
    >
      <div
        ref={stage}
        className="r3d-stage"
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        onPointerEnter={() => setHover(true)}
        onPointerLeave={leave}
      >
        <div className="r3d-top" aria-hidden="true">
          <span className="r3d-count">{active + 1} / {n}</span>
        </div>
        <button type="button" className="r3d-full" aria-label="View full screen" onClick={() => setFull(true)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></svg>
          <span>Full screen</span>
        </button>
        <div className="r3d-tilt">
          {photos.map((src, i) => {
            const d = off(i);
            const a = Math.abs(d);
            if (a > 2.6) return null;
            const front = Math.round(a) === 0;
            const style = {
              "--x": `${d * 52}%`,
              "--z": `${-a * 190}px`,
              "--r": `${-Math.max(-1, Math.min(1, d)) * 38}deg`,
              "--s": `${1 - Math.min(a, 2) * 0.05}`,
              "--o": `${a > 1.6 ? Math.max(0, 2.6 - a) : 1}`,
              "--b": `${front ? 1 : Math.max(0.42, 0.85 - a * 0.22)}`,
              zIndex: 50 - Math.round(a * 10),
            } as CSSProperties;
            return (
              <button
                key={src + i}
                type="button"
                className={`r3d-card${front ? " is-front" : ""}`}
                style={style}
                aria-label={`Photo ${i + 1} of ${n}`}
                aria-current={front}
                tabIndex={-1}
                onClick={() => {
                  if (start.current?.moved) return;
                  setAuto(false);
                  if (front) setFull(true);
                  else go(i);
                }}
              >
                {failed[i] ? (
                  <span className="r3d-fallback" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={sized(src, front ? 1800 : 1100)} alt={`${title}, photo ${i + 1}`} draggable={false} loading={i < 3 ? "eager" : "lazy"} decoding="async" onError={() => setFailed((f) => ({ ...f, [i]: true }))} />
                )}
                <span className="r3d-gloss" aria-hidden="true" />
              </button>
            );
          })}
        </div>
        <span className="r3d-floor" aria-hidden="true" />
        {n > 1 && (
          <>
            <button type="button" className="r3d-nav prev" aria-label="Previous photo" onClick={() => { setAuto(false); go(active - 1); }}>←</button>
            <button type="button" className="r3d-nav next" aria-label="Next photo" onClick={() => { setAuto(false); go(active + 1); }}>→</button>
          </>
        )}
      </div>

      {n > 1 && (
        <div className="r3d-strip" ref={strip} role="tablist" aria-label="Choose photo">
          {photos.map((src, i) => (
            <button key={src + i} type="button" role="tab" aria-selected={i === active} aria-label={`Photo ${i + 1}`} onClick={() => { setAuto(false); go(i); }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={sized(src, 240)} alt="" loading="lazy" draggable={false} />
            </button>
          ))}
        </div>
      )}
      <p className="r3d-hint">Drag, swipe or use the arrows · tap the photo for full screen</p>

      {full && <Lightbox photos={photos} title={title} index={active} onIndex={go} onClose={() => setFull(false)} />}
    </div>
  );
}

function Lightbox({ photos, title, index, onIndex, onClose }: { photos: string[]; title: string; index: number; onIndex: (i: number) => void; onClose: () => void }) {
  const n = photos.length;
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const sx = useRef<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.focus();
    return () => { document.body.style.overflow = prev; };
  }, []);
  useEffect(() => setZoom(null), [index]);

  return (
    <div
      ref={ref}
      className="lb"
      role="dialog"
      aria-modal="true"
      aria-label={`${title}, photo ${index + 1} of ${n}`}
      tabIndex={-1}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
        if (e.key === "ArrowRight") onIndex(index + 1);
        if (e.key === "ArrowLeft") onIndex(index - 1);
      }}
    >
      <div className="lb-bar">
        <span>{title} · {index + 1} / {n}</span>
        <button type="button" onClick={onClose} aria-label="Close full screen">✕</button>
      </div>
      <div
        className={`lb-img${zoom ? " zoomed" : ""}`}
        onPointerDown={(e) => { sx.current = e.clientX; }}
        onPointerUp={(e) => {
          const s = sx.current;
          sx.current = null;
          if (s !== null && !zoom && Math.abs(e.clientX - s) > 60) onIndex(index + (e.clientX < s ? 1 : -1));
        }}
        onClick={(e) => {
          if (zoom) return setZoom(null);
          const r = e.currentTarget.getBoundingClientRect();
          setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
        }}
        onPointerMove={(e) => {
          if (!zoom) return;
          const r = e.currentTarget.getBoundingClientRect();
          setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={sized(photos[index], 2400)} alt={`${title}, photo ${index + 1}`} draggable={false} style={zoom ? { transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined} />
      </div>
      {n > 1 && (
        <>
          <button type="button" className="lb-nav prev" aria-label="Previous photo" onClick={() => onIndex(index - 1)}>←</button>
          <button type="button" className="lb-nav next" aria-label="Next photo" onClick={() => onIndex(index + 1)}>→</button>
        </>
      )}
      <p className="lb-hint">{zoom ? "Move to look around · click to zoom out" : "Click the photo to zoom in · swipe or use the arrows"}</p>
    </div>
  );
}
