import type { Metadata } from "next";
import Link from "next/link";
import { getUser } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { publishedOnly } from "@/lib/queries";
import { pricePerSqm, savedIds, topLands } from "@/lib/lists";
import { nairaShort, naira } from "@/lib/format";
import Photo from "@/components/Photo";
import SaveButton from "@/components/SaveButton";
import Reveal from "@/components/Reveal";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Top lands" };

export default async function TopLands() {
  const [db, user] = await Promise.all([readDb(), getUser()]);
  const saved = savedIds(db, user);
  const list = topLands(publishedOnly(db), 12);
  return (
    <main className="page" id="top">
      <div className="wrap">
        <div className="rank-head">
          <p className="kicker-d">The ranking</p>
          <h1>Top lands</h1>
          <p>The most expensive plots on Kolé by total asking price, with the rate per square metre beside each one so you can compare like for like.</p>
        </div>
        {list.length === 0 ? (
          <div className="empty">No land is listed yet.</div>
        ) : (
          <div className="ledger" role="list">
            {list.map((p, i) => (
              <Reveal key={p.id} delay={Math.min(i, 5) * 60}>
                <article className="l-row" role="listitem">
                  <span className="l-rank">{String(i + 1).padStart(2, "0")}</span>
                  <Link href={`/properties/${p.id}`} className="l-photo" aria-label={`View ${p.title}`}>
                    <Photo photo={{ src: p.photos[0] ?? "", alt: p.title }} sizes="(max-width: 700px) 100vw, 280px" />
                  </Link>
                  <div className="l-main">
                    <Link href={`/properties/${p.id}`} className="l-title">
                      {p.title}
                    </Link>
                    <p className="muted">
                      {p.area}, {p.city}
                      {p.titleDoc ? ` · ${p.titleDoc}` : ""}
                      {p.demo ? " · Sample" : ""}
                    </p>
                  </div>
                  <dl className="l-nums">
                    <div>
                      <dt>Price</dt>
                      <dd>{nairaShort(p.price)}</dd>
                    </div>
                    <div>
                      <dt>Plot</dt>
                      <dd>{p.plotSqm ? `${p.plotSqm.toLocaleString("en-US")} sqm` : "—"}</dd>
                    </div>
                    <div>
                      <dt>Per sqm</dt>
                      <dd>{pricePerSqm(p) ? naira(pricePerSqm(p)) : "—"}</dd>
                    </div>
                  </dl>
                  <SaveButton propertyId={p.id} saved={saved.has(p.id)} label />
                </article>
              </Reveal>
            ))}
          </div>
        )}
        <div className="more-row">
          <Link className="btn plain" href="/lands">
            Browse every plot
          </Link>
        </div>
      </div>
    </main>
  );
}
