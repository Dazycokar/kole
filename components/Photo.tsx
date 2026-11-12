"use client";

import Image from "next/image";
import { useState, type CSSProperties } from "react";

export interface PhotoData {
  src: string;
  alt: string;
  tone?: [string, string];
  pos?: string;
}

interface Props {
  photo: PhotoData;
  sizes?: string;
  priority?: boolean;
  className?: string;
}

const TONES: [string, string][] = [
  ["#1b2a4e", "#ff6a4d"],
  ["#12274a", "#e0b35a"],
  ["#1c2733", "#8aa4c4"],
  ["#2b1f4d", "#4a63ff"],
  ["#10343a", "#ff8a6b"],
];
function toneFor(src: string): [string, string] {
  let h = 0;
  for (let i = 0; i < src.length; i++) h = (h * 31 + src.charCodeAt(i)) >>> 0;
  return TONES[h % TONES.length];
}

/** A photo that fills its parent, fades in once loaded, and falls back to a soft gradient. */
export default function Photo({ photo, sizes = "100vw", priority, className = "" }: Props) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const tone = photo.tone ?? toneFor(photo.src);
  // Only Unsplash links go through the Next image optimiser. Uploads and other links are shown as they are.
  const optimise = photo.src.startsWith("https://images.unsplash.com/");

  return (
    <span
      className={`photo${loaded ? " is-loaded" : ""} ${className}`}
      style={{ "--tone-a": tone[0], "--tone-b": tone[1] } as CSSProperties}
    >
      {!failed && photo.src && (
        <Image
          ref={(el) => {
            if (el && el.complete && el.naturalWidth > 0) setLoaded(true);
          }}
          src={photo.src}
          alt={photo.alt}
          fill
          sizes={sizes}
          priority={priority}
          unoptimized={!optimise}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          style={{ objectFit: "cover", objectPosition: photo.pos ?? "50% 50%" }}
        />
      )}
    </span>
  );
}
