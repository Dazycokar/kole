"use client";

import { useEffect, useRef, useState } from "react";

/** A 360 degree walk-around. Drag to look, scroll or pinch to zoom. Needs a 2:1 panorama photo. */
export default function Pano360({ src, title }: { src: string; title: string }) {
  const host = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    let disposed = false;
    let cleanup = () => {};
    (async () => {
      const el = host.current;
      if (!el) return;
      try {
        const THREE = await import("three");
        if (disposed) return;
        const canvas = document.createElement("canvas");
        const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
        if (!gl) throw new Error("webgl");

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        el.appendChild(renderer.domElement);
        renderer.domElement.className = "pano-canvas";

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1100);
        const geo = new THREE.SphereGeometry(500, 64, 40);
        geo.scale(-1, 1, 1);
        const tex = await new Promise<import("three").Texture>((res, rej) => {
          const loader = new THREE.TextureLoader();
          loader.setCrossOrigin("anonymous");
          loader.load(src, res, undefined, () => rej(new Error("image")));
        });
        if (disposed) { tex.dispose(); renderer.dispose(); return; }
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
        const mat = new THREE.MeshBasicMaterial({ map: tex });
        scene.add(new THREE.Mesh(geo, mat));

        let lon = 0, lat = 0, fov = 75, vx = 0;
        let dragging = false, px = 0, py = 0, auto = true, raf = 0;
        const pinch = { d: 0 };

        const size = () => {
          const w = el.clientWidth, h = el.clientHeight;
          renderer.setSize(w, h, false);
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
        };
        size();
        const ro = new ResizeObserver(size);
        ro.observe(el);

        const cv = renderer.domElement;
        const pts = new Map<number, { x: number; y: number }>();
        const onDown = (e: PointerEvent) => {
          pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
          cv.setPointerCapture(e.pointerId);
          dragging = true; auto = false; px = e.clientX; py = e.clientY;
          if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch.d = Math.hypot(a.x - b.x, a.y - b.y); }
        };
        const onMove = (e: PointerEvent) => {
          if (!pts.has(e.pointerId)) return;
          pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
          if (pts.size === 2) {
            const [a, b] = [...pts.values()];
            const d = Math.hypot(a.x - b.x, a.y - b.y);
            fov = Math.max(35, Math.min(95, fov - (d - pinch.d) * 0.15));
            pinch.d = d;
            return;
          }
          if (!dragging) return;
          const k = fov / 700;
          vx = (px - e.clientX) * k;
          lon += vx;
          lat = Math.max(-85, Math.min(85, lat + (e.clientY - py) * k));
          px = e.clientX; py = e.clientY;
        };
        const onUp = (e: PointerEvent) => { pts.delete(e.pointerId); if (!pts.size) dragging = false; };
        const onWheel = (e: WheelEvent) => {
          e.preventDefault();
          fov = Math.max(35, Math.min(95, fov + e.deltaY * 0.04));
        };
        const onKey = (e: KeyboardEvent) => {
          auto = false;
          if (e.key === "ArrowLeft") lon -= 6;
          if (e.key === "ArrowRight") lon += 6;
          if (e.key === "ArrowUp") lat = Math.min(85, lat + 4);
          if (e.key === "ArrowDown") lat = Math.max(-85, lat - 4);
        };
        cv.addEventListener("pointerdown", onDown);
        cv.addEventListener("pointermove", onMove);
        cv.addEventListener("pointerup", onUp);
        cv.addEventListener("pointercancel", onUp);
        cv.addEventListener("wheel", onWheel, { passive: false });
        el.addEventListener("keydown", onKey);

        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const tick = () => {
          raf = requestAnimationFrame(tick);
          if (auto && !reduce) lon += 0.06;
          else if (!dragging) { lon += vx; vx *= 0.92; }
          camera.fov = fov;
          camera.updateProjectionMatrix();
          const phi = THREE.MathUtils.degToRad(90 - lat);
          const theta = THREE.MathUtils.degToRad(lon);
          camera.lookAt(Math.sin(phi) * Math.cos(theta), Math.cos(phi), Math.sin(phi) * Math.sin(theta));
          renderer.render(scene, camera);
        };
        tick();
        setState("ready");

        cleanup = () => {
          cancelAnimationFrame(raf);
          ro.disconnect();
          cv.removeEventListener("pointerdown", onDown);
          cv.removeEventListener("pointermove", onMove);
          cv.removeEventListener("pointerup", onUp);
          cv.removeEventListener("pointercancel", onUp);
          cv.removeEventListener("wheel", onWheel);
          el.removeEventListener("keydown", onKey);
          geo.dispose(); mat.dispose(); tex.dispose(); renderer.dispose();
          cv.remove();
        };
      } catch (e) {
        if (disposed) return;
        setMsg((e as Error).message === "webgl" ? "Your browser could not start 3D graphics, so the 360 tour cannot run here." : "The 360 photo could not be loaded.");
        setState("error");
      }
    })();
    return () => {
      disposed = true;
      cleanup();
    };
  }, [src]);

  return (
    <div className="pano" ref={host} tabIndex={0} role="img" aria-label={`360 degree tour of ${title}. Drag to look around.`}>
      {state === "loading" && <p className="pano-msg">Loading the 360 tour…</p>}
      {state === "error" && <p className="pano-msg">{msg}</p>}
      {state === "ready" && <p className="r3d-hint pano-hint">Drag to look around · scroll or pinch to zoom</p>}
    </div>
  );
}
