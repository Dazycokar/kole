import Link from "next/link";
import { AREAS, CITIES } from "@/lib/areas";
import { getUser } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { publishedOnly } from "@/lib/queries";
import { AREA_PHOTO, pricePerSqm, savedIds, slugify, topBuildings, topLands } from "@/lib/lists";
import { naira, nairaShort } from "@/lib/format";
import { PH } from "@/lib/seed";
import { SITE } from "@/lib/site";
import { DEV_TYPES } from "@/lib/devtypes";
import HeroSearch from "@/components/HeroSearch";
import HeroSlides from "@/components/HeroSlides";
import Photo from "@/components/Photo";
import PropertyCard from "@/components/PropertyCard";
import Reveal from "@/components/Reveal";
import Ring3D from "@/components/Ring3D";
import SaveButton from "@/components/SaveButton";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [db, user] = await Promise.all([readDb(), getUser()]);
  const live = publishedOnly(db);
  const saved = savedIds(db, user);

  const tb = topBuildings(live, 5);
  const tl = topLands(live, 6);
  const houses = live.filter((p) => p.type === "house").length;
  const lands = live.length - houses;
  const devCount = new Set(live.map((p) => p.developerId)).size;
  const devCountByType: Record<string, number> = {};
  for (const u of db.users) {
    if (u.role === "developer" && u.status === "active" && u.devType && live.some((p) => p.developerId === u.id)) devCountByType[u.devType] = (devCountByType[u.devType] ?? 0) + 1;
  }
  const showcase = tb.find((p) => p.photos.length >= 2) ?? live.find((p) => p.photos.length >= 2);

  const slides = [...tb.slice(0, 3), ...tl.slice(0, 2)].map((p) => ({
    id: p.id, title: p.title, place: `${p.area}, ${p.city}`, price: nairaShort(p.price), photo: p.photos[0] ?? "",
  }));

  return (
    <main id="top">
      {/* 1. Hero: full-bleed rotating photos of the priciest listings, with the working search box sitting on the photo */}
      <section className="khero" aria-label="Search">
        <div className="khero-frame">
          <HeroSlides slides={slides} />
          <div className="khero-shade" aria-hidden="true" />
          <div className="khero-copy">
            <p className="kicker">{SITE.kicker}</p>
            <h1 className="wordmark" aria-label={SITE.name}>
              Kol<span>é</span>
            </h1>
            <p className="lede">Walk through Lagos and Abuja&apos;s finest buildings and land in 3D before you visit.</p>
          </div>
        </div>
        <div className="khero-search wrap">
          <HeroSearch />
        </div>
      </section>

      {/* 2. Live numbers */}
      <section className="kstats wrap" aria-label="On Kolé right now">
        <div><b>{houses}</b><span>buildings</span></div>
        <div><b>{lands}</b><span>plots of land</span></div>
        <div><b>{devCount}</b><span>partner developers</span></div>
        <div><b>{tb[0] ? nairaShort(tb[0].price) : "—"}</b><span>highest asking price</span></div>
      </section>

      {/* 3. Top buildings */}
      <section className="block" id="top-buildings">
        <div className="wrap">
          <Reveal>
            <div className="sec-head">
              <h2>Top buildings</h2>
              <p>The most expensive houses on Kolé right now, ranked by asking price.</p>
            </div>
          </Reveal>
          {tb.length === 0 ? (
            <div className="empty">No buildings are listed for sale yet.</div>
          ) : (
            <div className="grid">
              {tb.map((p, i) => (
                <Reveal key={p.id} delay={(i % 3) * 90} className={`cell${i === 0 ? " span2" : ""}`}>
                  <PropertyCard p={p} rank={i + 1} saved={saved.has(p.id)} />
                </Reveal>
              ))}
            </div>
          )}
          <div className="more-row">
            <Link className="btn plain" href="/top-buildings">
              See the full ranking
            </Link>
          </div>
        </div>
      </section>

      {/* 4. 3D showcase */}
      {showcase && (
        <section className="block showcase-band" id="in-3d">
          <div className="wrap showcase">
            <Reveal className="sc-copy">
              <p className="kicker-d on-dark">New · 3D view</p>
              <h2>See it from every side before you drive across town.</h2>
              <p>Every Kolé listing with two or more photos opens in a 3D gallery you can drag. Developers can also add a 360° walk-around.</p>
              <ul>
                <li>Drag, swipe or use the arrow keys</li>
                <li>Heart a property to add it to your shortlist</li>
                <li>Ask the Kolé team anything in the chat</li>
              </ul>
              <div className="cta">
                <Link className="btn solid" href={`/properties/${showcase.id}?view=3d`}>
                  Open {showcase.title}
                </Link>
              </div>
            </Reveal>
            <div className="sc-view">
              <Ring3D photos={showcase.photos} title={showcase.title} />
            </div>
          </div>
        </section>
      )}

      {/* 5. Top lands: a snap rail */}
      <section className="block" id="top-lands">
        <div className="wrap">
          <Reveal>
            <div className="sec-head">
              <h2>Top lands</h2>
              <p>The most expensive plots on Kolé, with the price per square metre beside each.</p>
            </div>
          </Reveal>
        </div>
        {tl.length === 0 ? (
          <div className="wrap"><div className="empty">No land is listed yet.</div></div>
        ) : (
          <div className="rail" tabIndex={0} aria-label="Top lands, scroll sideways">
            {tl.map((p, i) => (
              <article className="rcard" key={p.id}>
                <Link href={`/properties/${p.id}`} className="rc-photo" aria-label={`View ${p.title}`}>
                  <Photo photo={{ src: p.photos[0] ?? "", alt: p.title }} sizes="(max-width: 700px) 80vw, 360px" />
                  <span className="rank sm">{String(i + 1).padStart(2, "0")}</span>
                </Link>
                <div className="rc-save">
                  <SaveButton propertyId={p.id} saved={saved.has(p.id)} />
                </div>
                <div className="rc-body">
                  <p className="rc-price">{nairaShort(p.price)}</p>
                  <h3>{p.title}</h3>
                  <p className="muted">
                    {p.area}, {p.city}
                  </p>
                  <p className="rc-meta">
                    {p.plotSqm ? `${p.plotSqm.toLocaleString("en-US")} sqm` : ""}
                    {pricePerSqm(p) ? ` · ${naira(pricePerSqm(p))}/sqm` : ""}
                  </p>
                </div>
              </article>
            ))}
            <Link href="/top-lands" className="rcard rc-more">
              <span>See the full ranking →</span>
            </Link>
          </div>
        )}
      </section>

      {/* 6. Areas as a list with hover photos */}
      <section className="block" id="areas">
        <div className="wrap">
          <Reveal>
            <div className="sec-head">
              <h2>Where we list</h2>
              <p>Lagos Island, the Lekki axis and the luxury districts of Abuja.</p>
            </div>
          </Reveal>
          <div className="alist">
            {CITIES.flatMap((c) => AREAS[c].map((a) => ({ a, c }))).map(({ a, c }) => {
              const n = live.filter((p) => p.area === a).length;
              return (
                <Link key={a} href={`/areas/${slugify(a)}`} className="arow">
                  <span className="ar-name">{a}</span>
                  <span className="ar-city">{c}</span>
                  <span className="ar-n">
                    {n} {n === 1 ? "listing" : "listings"}
                  </span>
                  <span className="ar-photo" aria-hidden="true">
                    <Photo photo={{ src: AREA_PHOTO[a] ?? "", alt: "" }} sizes="220px" />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* 7. Buying from abroad */}
      <section className="block" id="abroad">
        <div className="wrap abroad-band">
          <Reveal className="ab-copy">
            <p className="kicker-d">Buying from abroad?</p>
            <h2>Look around first. Check the papers. Then pay.</h2>
            <p>Most problems for buyers overseas come from not being able to see the property or the documents. Kolé is the go-between: we put both in front of you before you send money.</p>
            <div className="cta">
              <Link className="btn solid" href="/guide">
                Read the 5 checks
              </Link>
            </div>
          </Reveal>
          <ul className="ab-list">
            <li><b>See it</b><span>3D view, 360° tour and a live video tour on request.</span></li>
            <li><b>See the papers</b><span>Each listing shows which title documents the developer can show.</span></li>
            <li><b>One point of contact</b><span>You deal with Kolé. We deal with the developer and bring you the answers.</span></li>
            <li><b>Know the plan</b><span>Build stage, handover month and payment plan sit on the listing.</span></li>
          </ul>
        </div>
      </section>

      {/* 8. Types of developers */}
      <section className="block" id="developer-types">
        <div className="wrap">
          <Reveal>
            <div className="sec-head">
              <h2>Types of developers</h2>
              <p>Different builders suit different buyers. Pick a kind to see the developers Kolé works with.</p>
            </div>
          </Reveal>
          <div className="dtypes">
            {DEV_TYPES.map((t, i) => (
              <Reveal key={t.id} delay={(i % 3) * 80}>
                <Link href={`/developers?type=${t.id}`} className="dtype">
                  <b>{t.label}</b>
                  <span>{t.blurb}</span>
                  <em>
                    {devCountByType[t.id] ?? 0} {(devCountByType[t.id] ?? 0) === 1 ? "developer" : "developers"} →
                  </em>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 9. Developer call to action */}
      <section className="block last">
        <div className="wrap">
          <Reveal>
            <div className="contact-frame">
              <Photo photo={{ src: PH.land2, alt: "Aerial view of a new housing development", tone: ["#1b2a4e", "#ff8a6b"] }} sizes="100vw" />
              <span className="contact-shade" aria-hidden="true" />
              <div className="contact-inner">
                <h2>
                  Building in
                  <br />
                  Lagos or <span>Abuja?</span>
                </h2>
                <div className="contact-side">
                  <p>You do not need an account. Tell Kolé what you are building and our team lists it with photos, a 3D view and the documents buyers ask for. Buyers talk to us, and we bring you the serious ones.</p>
                  <div className="cta">
                    <Link className="btn solid" href="/partner">
                      Partner with Kolé
                    </Link>
                    <Link className="btn ghost" href="/developers">
                      Developers we work with
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <footer className="wrap foot2">
        <div>
          <b className="brand">
            {SITE.name}
            <b>.</b>
          </b>
          <p>{SITE.tagline}</p>
        </div>
        <nav aria-label="Footer">
          <Link href="/buildings">Buildings</Link>
          <Link href="/lands">Lands</Link>
          <Link href="/top-buildings">Top buildings</Link>
          <Link href="/top-lands">Top lands</Link>
          <Link href="/areas">Areas</Link>
          <Link href="/developers">Developers</Link>
          <Link href="/about">About</Link>
          <Link href="/guide">Buying from abroad</Link>
          <Link href="/partner">For developers</Link>
          <Link href="/saved">Saved</Link>
        </nav>
        <p className="muted">Sample listings are for demonstration only.</p>
      </footer>
    </main>
  );
}
