import Link from "next/link";
import type { Property } from "@/lib/types";
import { nairaShort, purposeLabel, statusLabel } from "@/lib/format";
import Photo from "./Photo";
import SaveButton from "./SaveButton";

export function factsLine(p: Property): string {
  if (p.type === "land") {
    return [p.plotSqm ? `${p.plotSqm.toLocaleString("en-US")} sqm plot` : "", p.titleDoc].filter(Boolean).join(" · ");
  }
  return [
    p.beds !== undefined ? `${p.beds} bed` : "",
    p.baths !== undefined ? `${p.baths} bath` : "",
    p.sizeSqm ? `${p.sizeSqm.toLocaleString("en-US")} sqm` : "",
  ]
    .filter(Boolean)
    .join(" · ");
}

export default function PropertyCard({ p, sizes, saved = false, rank }: { p: Property; sizes?: string; saved?: boolean; rank?: number }) {
  return (
    <article className="card pcard">
      <Photo
        photo={{ src: p.photos[0] ?? "", alt: p.title }}
        sizes={sizes ?? "(max-width: 620px) 100vw, (max-width: 980px) 50vw, 33vw"}
      />
      <span className="card-shade" aria-hidden="true" />
      <div className="card-top">
        <span className="pill">{purposeLabel(p)}</span>
        <span className="pill">{p.type === "land" ? "Land" : p.subtype || "House"}</span>
        {p.status !== "available" && <span className="pill pill-status">{statusLabel(p)}</span>}
        {p.demo && <span className="pill">Sample</span>}
        <span className="go" aria-hidden="true">
          ↗
        </span>
      </div>
      <div className="card-save">
        <SaveButton propertyId={p.id} saved={saved} />
      </div>
      {rank !== undefined && (
        <span className="rank" aria-label={`Number ${rank}`}>
          {String(rank).padStart(2, "0")}
        </span>
      )}
      <div className="card-body">
        <p className="price">
          {nairaShort(p.price)}
          {p.priceNote && <small> {p.priceNote}</small>}
        </p>
        <h3>{p.title}</h3>
        <p className="loc">
          {p.area}, {p.city}
        </p>
        <p className="facts">{factsLine(p)}</p>
        {(p.panorama || p.verified) && (
          <p className="has3d">
            {p.verified ? "✓ Docs checked" : ""}
            {p.verified && p.panorama ? " · " : ""}
            {p.panorama ? "360° tour" : ""}
          </p>
        )}
      </div>
      <Link href={`/properties/${p.id}`} className="card-hit" aria-label={`View ${p.title}`} />
    </article>
  );
}
