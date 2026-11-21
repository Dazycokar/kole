import type { Metadata } from "next";
import Link from "next/link";
import { AREAS, CITIES } from "@/lib/areas";
import { readDb } from "@/lib/db";
import { publishedOnly } from "@/lib/queries";
import { AREA_PHOTO, slugify } from "@/lib/lists";
import { nairaShort } from "@/lib/format";
import Photo from "@/components/Photo";
import Reveal from "@/components/Reveal";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Areas" };

export default async function Areas() {
  const live = publishedOnly(await readDb());
  return (
    <main className="page" id="top">
      <div className="wrap">
        <div className="rank-head">
          <p className="kicker-d">Where we list</p>
          <h1>Areas</h1>
          <p>Lagos Island, the Lekki axis and the luxury districts of Abuja. Pick a neighbourhood to see everything listed there.</p>
        </div>
        {CITIES.map((city) => (
          <section key={city} className="area-city">
            <h2>{city}</h2>
            <div className="tiles">
              {AREAS[city].map((a, i) => {
                const here = live.filter((p) => p.area === a);
                const top = here.reduce((m, p) => Math.max(m, p.price), 0);
                return (
                  <Reveal key={a} delay={(i % 3) * 80} className="cell">
                    <article className="card tile">
                      <Photo photo={{ src: AREA_PHOTO[a] ?? "", alt: "" }} sizes="(max-width: 620px) 100vw, (max-width: 980px) 50vw, 33vw" />
                      <span className="card-shade" aria-hidden="true" />
                      <div className="card-top">
                        <span className="pill">{city}</span>
                        <span className="go" aria-hidden="true">↗</span>
                      </div>
                      <div className="card-body">
                        <h3>{a}</h3>
                        <p className="loc">
                          {here.length} {here.length === 1 ? "listing" : "listings"}
                          {top ? ` · up to ${nairaShort(top)}` : ""}
                        </p>
                      </div>
                      <Link href={`/areas/${slugify(a)}`} className="card-hit" aria-label={`Browse ${a}`} />
                    </article>
                  </Reveal>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
