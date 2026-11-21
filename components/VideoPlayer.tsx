"use client";

import { useState } from "react";
import type { PropertyVideo } from "@/lib/types";

/** Plays the property videos at full quality, with a strip to switch between them. */
export default function VideoPlayer({ videos, title }: { videos: PropertyVideo[]; title: string }) {
  const [i, setI] = useState(0);
  const v = videos[Math.min(i, videos.length - 1)];
  if (!v) return null;
  return (
    <div className="vplayer">
      <div className="vplayer-main">
        {/* key forces a fresh element so the previous video stops */}
        <video key={v.url} src={v.url} poster={v.poster} controls playsInline preload="metadata" aria-label={`${v.title || "Video"} of ${title}`} controlsList="nodownload" />
      </div>
      {videos.length > 1 && (
        <div className="vplayer-list" role="tablist" aria-label="Choose video">
          {videos.map((x, k) => (
            <button key={x.url} type="button" role="tab" aria-selected={k === i} onClick={() => setI(k)}>
              <span className="thumb" style={x.poster ? { backgroundImage: `url(${x.poster})` } : undefined} />
              <span className="cap">{x.title || `Video ${k + 1}`}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
