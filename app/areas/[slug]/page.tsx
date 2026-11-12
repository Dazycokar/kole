import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AREAS, CITIES } from "@/lib/areas";
import { getUser } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { publishedOnly } from "@/lib/queries";
import { AREA_PHOTO, savedIds, slugify } from "@/lib/lists";
import { nairaShort } from "@/lib/format";
import Photo from "@/components/Photo";
import PropertyCard from "@/components/PropertyCard";
import Reveal from "@/components/Reveal";

export const dynamic = "force-dynamic";

function find(slug: string) {
  for (const city of CITIES) for (const a of AREAS[city]) if (slugify(a) === slug) return { city, area: a };
  return null;
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const f = find(params.slug);
  return { title: f ? f.area : "Area" };
}

export default async function AreaPage({ params }: { params: { slug: string } }) {
  const f = find(params.slug);
  if (!f) notFound();
  const [db, user] = await Promise.all([readDb(), getUser()]);
  const saved = savedIds(db, user);
  const list = publishedOnly(db).filter((p) => p.area === f.area).sort((a, b) => b.price - a.price);
  const houses = list.filter((p) => p.type === "house").length;
  return (
    <main className="page" id="top">
      <div className="wrap">
        <Link href="/areas" className="back">
          ← All areas
        </Link>
        <div className="area-hero">
          <Photo photo={{ src: AREA_PHOTO[f.area] ?? "", alt: "" }} sizes="100vw" priority />
          <span className="card-shade" aria-hidden="true" />
          <div className="area-hero-in">
            <span className="pill">{f.city}</span>
            <h1>{f.area}</h1>
            <p>
              {houses} {houses === 1 ? "building" : "buildings"} · {list.length - houses} {list.length - houses === 1 ? "plot" : "plots"}
              {list[0] ? ` · up to ${nairaShort(list[0].price)}` : ""}
            </p>
          </div>
        </div>
        <div className="grid">
          {list.length === 0 && <div className="empty">Nothing is listed in {f.area} right now. Check another area or come back soon.</div>}
          {list.map((p, i) => (
            <Reveal key={p.id} delay={(i % 3) * 90} className="cell">
              <PropertyCard p={p} saved={saved.has(p.id)} />
            </Reveal>
          ))}
        </div>
      </div>
    </main>
  );
}
