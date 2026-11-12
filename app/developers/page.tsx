import type { Metadata } from "next";
import Link from "next/link";
import { readDb } from "@/lib/db";
import { nairaShort } from "@/lib/format";
import { DEV_TYPES, devTypeLabel, isDevType } from "@/lib/devtypes";
import Photo from "@/components/Photo";
import Reveal from "@/components/Reveal";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Developers" };

export default async function Developers({ searchParams }: { searchParams: { type?: string } }) {
  const db = await readDb();
  const want = isDevType(searchParams.type) ? searchParams.type : "";
  const devs = db.users
    .filter((u) => u.role === "developer" && u.status === "active" && (!want || u.devType === want))
    .map((d) => {
      const mine = db.properties.filter((p) => p.developerId === d.id && p.published).sort((a, b) => b.price - a.price);
      return { d, mine };
    })
    .filter((x) => x.mine.length > 0)
    .sort((a, b) => Number(!!b.d.verified) - Number(!!a.d.verified) || b.mine.length - a.mine.length);

  return (
    <main className="page" id="top">
      <div className="wrap">
        <div className="rank-head">
          <p className="kicker-d">Who is building</p>
          <h1>Developers</h1>
          <p>These are the developers Kolé works with. A tick means the Kolé team has also checked them. You never have to chase a developer yourself: ask Kolé about any of their properties and we handle it.</p>
        </div>

        <div className="filters" role="group" aria-label="Kind of developer" style={{ marginBottom: 22 }}>
          <Link href="/developers" className="chip" data-on={!want}>
            All kinds
          </Link>
          {DEV_TYPES.map((t) => (
            <Link key={t.id} href={`/developers?type=${t.id}`} className="chip" data-on={want === t.id}>
              {t.label}
            </Link>
          ))}
        </div>

        {devs.length === 0 ? (
          <div className="empty">No developers of this kind have live listings yet.</div>
        ) : (
          <div className="devs">
            {devs.map(({ d, mine }, i) => {
              const areas = Array.from(new Set(mine.map((p) => p.area))).slice(0, 3).join(", ");
              return (
                <Reveal key={d.id} delay={(i % 2) * 90}>
                  <Link className="dev" href={`/developers/${d.id}`}>
                    <span className="dev-photo">
                      <Photo photo={{ src: mine[0].photos[0] ?? "", alt: "" }} sizes="(max-width: 700px) 100vw, 40vw" />
                    </span>
                    <span className="dev-body">
                      <b>{d.company || d.name}</b>
                      <span className="dev-tags">
                        {d.verified && <span className="tag good">✓ Verified</span>}
                        {d.devType && <span className="tag">{devTypeLabel(d.devType)}</span>}
                        {d.demo && <span className="tag">Sample developer</span>}
                      </span>
                      <span className="muted">
                        {mine.length} {mine.length === 1 ? "listing" : "listings"} · top price {nairaShort(mine[0].price)}
                      </span>
                      <span className="muted">{areas}</span>
                    </span>
                  </Link>
                </Reveal>
              );
            })}
          </div>
        )}
        <div className="more-row">
          <Link className="btn solid" href="/partner">
            Partner with Kolé
          </Link>
        </div>
      </div>
    </main>
  );
}
