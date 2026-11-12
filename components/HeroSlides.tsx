"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Photo from "./Photo";

export interface Slide {
  id: string;
  title: string;
  place: string;
  price: string;
  photo: string;
}

/** Crossfading hero photos of the most expensive listings, with a caption that links to the one on screen. */
export default function HeroSlides({ slides }: { slides: Slide[] }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (slides.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setI((n) => (n + 1) % slides.length), 6500);
    return () => clearInterval(t);
  }, [slides.length]);
  if (!slides.length) return null;
  const cur = slides[i];

  return (
    <>
      {slides.map((s, n) => (
        <span key={s.id} className={`hs${n === i ? " on" : ""}`} aria-hidden={n !== i}>
          <Photo photo={{ src: s.photo, alt: n === i ? s.title : "", pos: "50% 55%" }} priority={n === 0} sizes="100vw" />
        </span>
      ))}
      <Link href={`/properties/${cur.id}?view=3d`} className="hs-cap" aria-label={`${cur.title}, ${cur.price}. Open in 3D`}>
        <span className="hs-k">Now showing · {String(i + 1).padStart(2, "0")}/{String(slides.length).padStart(2, "0")}</span>
        <b>{cur.title}</b>
        <span>
          {cur.place} · {cur.price}
        </span>
        <span className="hs-go">Open in 3D ↗</span>
      </Link>
      {slides.length > 1 && (
        <div className="hs-dots" role="group" aria-label="Choose hero photo">
          {slides.map((s, n) => (
            <button key={s.id} type="button" aria-label={`Show ${s.title}`} aria-pressed={n === i} onClick={() => setI(n)} />
          ))}
        </div>
      )}
    </>
  );
}
