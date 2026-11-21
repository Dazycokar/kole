"use client";

import { useState } from "react";
import Photo from "./Photo";

export default function Gallery({ photos, title }: { photos: string[]; title: string }) {
  const [i, setI] = useState(0);
  const list = photos.length ? photos : [""];
  const go = (n: number) => setI((n + list.length) % list.length);

  return (
    <div
      className="gallery"
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") go(i + 1);
        if (e.key === "ArrowLeft") go(i - 1);
      }}
    >
      <div className="g-main">
        <Photo key={i} photo={{ src: list[i], alt: `${title}, photo ${i + 1} of ${list.length}` }} sizes="(max-width: 980px) 100vw, 60vw" priority={i === 0} />
        {list.length > 1 && (
          <>
            <button type="button" className="g-nav prev" onClick={() => go(i - 1)} aria-label="Previous photo">
              ←
            </button>
            <button type="button" className="g-nav next" onClick={() => go(i + 1)} aria-label="Next photo">
              →
            </button>
            <span className="g-count pill">
              {i + 1} / {list.length}
            </span>
          </>
        )}
      </div>
      {list.length > 1 && (
        <div className="g-thumbs">
          {list.map((src, n) => (
            <button key={src + n} type="button" className="g-thumb" aria-current={n === i} aria-label={`Show photo ${n + 1}`} onClick={() => setI(n)}>
              <Photo photo={{ src, alt: "" }} sizes="120px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
