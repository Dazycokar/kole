"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Gallery from "./Gallery";
import Ring3D from "./Ring3D";

const Pano360 = dynamic(() => import("./Pano360"), { ssr: false, loading: () => <div className="pano"><p className="pano-msg">Loading the 360 tour…</p></div> });

type Mode = "3d" | "photos" | "360";

/** The picture area of a listing: a 3D photo view, a plain gallery, and a 360 tour when the developer uploaded one. */
export default function PropertyViewer({ photos, title, panorama, initial }: { photos: string[]; title: string; panorama?: string; initial?: string }) {
  const can3d = photos.length >= 2;
  const first: Mode = initial === "360" && panorama ? "360" : initial === "photos" || !can3d ? "photos" : "3d";
  const [mode, setMode] = useState<Mode>(first);
  const tabs: [Mode, string][] = [];
  if (can3d) tabs.push(["3d", "3D view"]);
  tabs.push(["photos", "Photos"]);
  if (panorama) tabs.push(["360", "360° tour"]);

  return (
    <div className="viewer">
      {tabs.length > 1 && (
        <div className="v-tabs" role="tablist" aria-label="How to view this property">
          {tabs.map(([m, label]) => (
            <button key={m} type="button" role="tab" aria-selected={mode === m} onClick={() => setMode(m)}>
              {label}
            </button>
          ))}
        </div>
      )}
      {mode === "3d" && <Ring3D photos={photos} title={title} />}
      {mode === "photos" && <Gallery photos={photos} title={title} />}
      {mode === "360" && panorama && <Pano360 src={panorama} title={title} />}
    </div>
  );
}
