"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent as RPointerEvent } from "react";
import { sized } from "@/lib/img";

/** A 3D photo carousel. Photos sit in a curved row in real 3D space. Drag, swipe, use the arrows or the dots. */
export default function Ring3D({ photos, title }: { photos: string[]; title: string }) {
  const n = photos.length;
  const [active, setActive] = useState(0);
  const [drag, setDrag] = useState(0); // drag distance in cards, live while dragging
  const [auto, setAuto] = useState(true);
  const [failed, setFailed] = useState<Record<number, boolean>>({});
  const stage = useRef<HTMLDivElement>(null);
  const start = useRef<{ x: number; id: number; moved: boolean } | null>(null);

  const go = useCallback((to: number) => setActive(((to % n) + n) % n), [n]);

  useEffect(() => {
    if (!auto || n < 2) return;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setActive((a) => (a + 1) % n), 4200);
    return () => clearInterval(t);
  }, [auto, n]);

  function down(e: RPointerEvent<HTMLDivElement>) {
    start.current = { x: e.clientX, id: e.pointerId, moved: false };
    setAuto(false);
  }
  function move(e: RPointerEvent<HTMLDivElement>) {
    const s = start.current;
    const el = stage.current;
    if (el && e.pointerType === "mouse" && !s) {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--ty", `${(((e.clientX - r.left) / r.width) * 2 - 1) * 5}deg`);
      el.style.setProperty("--tx", `${(((e.clientY - r.top) / r.height) * 2 - 1) * -3}deg`);
    }
    if (!s) return;
    const w = el?.clientWidth ?? 600;
    const dx = e.clientX - s.x;
    if (Math.abs(dx) > 6 && !s.moved) {
      s.moved = true;
      el?.setPointerCapture(s.id);
    }
    if (s.moved) setDrag(-dx / (w * 0.45));
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
    const el = stage.current;
    if (el) {
      el.style.setProperty("--tx", "0deg");
      el.style.setProperty("--ty", "0deg");
    }
  }

  // Shortest signed distance from the active card, so the row wraps around.
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
      aria-label={`${title} in 3D. Use the arrow keys to move.`}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") { setAuto(false); go(active + 1); }
        if (e.key === "ArrowLeft") { setAuto(false); go(active - 1); }
      }}
    >
      <div
        ref={stage}
        className="r3d-stage"
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        onPointerLeave={leave}
      >
        <div className="r3d-tilt">
          {photos.map((src, i) => {
            const d = off(i);
            const a = Math.abs(d);
            if (a > 2.6) return null;
            const style = {
              "--x": `${d * 46}%`,
              "--z": `${-a * 150}px`,
              "--r": `${-Math.max(-1, Math.min(1, d)) * 42}deg`,
              "--s": `${1 - Math.min(a, 2) * 0.06}`,
              "--o": `${a > 1.6 ? Math.max(0, 2.6 - a) : 1}`,
              zIndex: 50 - Math.round(a * 10),
            } as CSSProperties;
            return (
              <button
                key={src + i}
                type="button"
                className={`r3d-card${Math.round(a) === 0 ? " is-front" : ""}`}
                style={style}
                aria-label={`Photo ${i + 1} of ${n}`}
                aria-current={Math.round(a) === 0}
                tabIndex={-1}
                onClick={() => {
                  if (!start.current?.moved) { setAuto(false); go(i); }
                }}
              >
                {failed[i] ? (
                  <span className="r3d-fallback" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={sized(src, 1100)} alt={`${title}, photo ${i + 1}`} draggable={false} loading={i < 3 ? "eager" : "lazy"} onError={() => setFailed((f) => ({ ...f, [i]: true }))} />
                )}
                <span className="r3d-gloss" aria-hidden="true" />
              </button>
            );
          })}
        </div>
        <span className="r3d-floor" aria-hidden="true" />
      </div>

      {n > 1 && (
        <div className="r3d-ctrl">
          <button type="button" className="v-btn" aria-label="Previous photo" onClick={() => { setAuto(false); go(active - 1); }}>←</button>
          <div className="r3d-dots" role="tablist" aria-label="Choose photo">
            {photos.map((_, i) => (
              <button key={i} type="button" role="tab" aria-selected={i === active} aria-label={`Photo ${i + 1}`} onClick={() => { setAuto(false); go(i); }} />
            ))}
          </div>
          <button type="button" className="v-btn" aria-label="Next photo" onClick={() => { setAuto(false); go(active + 1); }}>→</button>
        </div>
      )}
      <p className="r3d-hint">Drag, swipe or use the arrows · {active + 1} / {n}</p>
    </div>
  );
}
