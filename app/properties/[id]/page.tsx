import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getUser } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { canManage, canSee } from "@/lib/queries";
import { naira, purposeLabel, statusLabel } from "@/lib/format";
import PropertyViewer from "@/components/PropertyViewer";
import PropertyCard from "@/components/PropertyCard";
import PropertyChat from "@/components/PropertyChat";
import SaveButton from "@/components/SaveButton";
import { savedIds } from "@/lib/lists";
import { DOCS, devTypeLabel, stageLabel } from "@/lib/devtypes";
import { monthYear, shortDate } from "@/lib/dates";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const db = await readDb();
  const p = db.properties.find((x) => x.id === params.id && x.published);
  return p ? { title: p.title, description: p.description.slice(0, 160) } : { title: "Property" };
}

export default async function PropertyPage({ params, searchParams }: { params: { id: string }; searchParams: { view?: string } }) {
  const [db, user] = await Promise.all([readDb(), getUser()]);
  const p = db.properties.find((x) => x.id === params.id);
  if (!p || !canSee(user, p)) notFound();

  const similar = db.properties
    .filter((x) => x.published && x.id !== p.id && x.type === p.type && (x.area === p.area || x.city === p.city))
    .sort((a, b) => Number(b.area === p.area) - Number(a.area === p.area))
    .slice(0, 3);

  const dev = db.users.find((u) => u.id === p.developerId && u.role === "developer");
  const facts: [string, string][] = [];
  if (p.type === "house") {
    if (p.beds !== undefined) facts.push(["Bedrooms", String(p.beds)]);
    if (p.baths !== undefined) facts.push(["Bathrooms", String(p.baths)]);
    if (p.parking !== undefined) facts.push(["Parking", String(p.parking)]);
    if (p.sizeSqm) facts.push(["Building", `${p.sizeSqm.toLocaleString("en-US")} sqm`]);
  }
  if (p.type === "house" && p.stage) facts.push(["Stage", p.stage === "ready" ? stageLabel(p.stage) : `${stageLabel(p.stage)}${p.handover ? `, due ${monthYear(p.handover)}` : ""}`]);
  if (p.plotSqm) facts.push(["Plot", `${p.plotSqm.toLocaleString("en-US")} sqm`]);
  if (p.titleDoc) facts.push(["Title", p.titleDoc]);
  facts.push(["Type", p.type === "land" ? p.subtype || "Land" : p.subtype || "House"]);

  return (
    <main className="page" id="top">
      <div className="wrap">
        <Link href={p.type === "land" ? "/lands" : "/buildings"} className="back">
          ← All {p.type === "land" ? "lands" : "buildings"}
        </Link>

        <div className="detail">
          <div className="d-main">
            <PropertyViewer photos={p.photos} title={p.title} panorama={p.panorama} initial={searchParams.view} />

            <div className="d-head">
              <div className="d-tags">
                <span className="tag">{purposeLabel(p)}</span>
                <span className={`tag status-${p.status}`}>{statusLabel(p)}</span>
                {!p.published && <span className="tag">Hidden from the site</span>}
                {p.verified && <span className="tag good">✓ Documents checked by Kolé</span>}
                {p.demo && <span className="tag">Sample listing</span>}
              </div>
              <h1>{p.title}</h1>
              <p className="d-loc">
                {p.address ? `${p.address} · ` : ""}
                {p.area}, {p.city}
              </p>
            </div>

            <dl className="d-facts">
              {facts.map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>

            <section className="d-section">
              <h2>About this {p.type === "land" ? "plot" : "property"}</h2>
              <p className="d-desc">{p.description}</p>
            </section>

            {p.features.length > 0 && (
              <section className="d-section">
                <h2>Features</h2>
                <ul className="d-features">
                  {p.features.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              </section>
            )}

            <section className="d-section" id="documents">
              <h2>Title and documents</h2>
              {(p.docs?.length ?? 0) === 0 && !p.titleDoc ? (
                <p className="muted">No documents are listed yet. Ask Kolé for them in the chat before going further.</p>
              ) : (
                <>
                {p.titleDoc && <p className="d-desc">Title type: <b>{p.titleDoc}</b></p>}
                <ul className="docs">
                  {DOCS.map((d) => {
                    const has = p.docs?.includes(d);
                    return (
                      <li key={d} className={has ? "have" : "no"}>
                        {d}
                        <small>{has ? "Developer can show this" : "Not listed"}</small>
                      </li>
                    );
                  })}
                </ul>
                </>
              )}
              <p className="muted small">
                {p.verified
                  ? "The Kolé admin has seen these documents. That is not a legal opinion, so still have your own lawyer search the title."
                  : "The developer says these are available. Kolé has not checked them yet. Ask us for copies and have your own lawyer search the title before you pay."}{" "}
                <Link href="/guide">Read the buying guide</Link>.
              </p>
            </section>

            {p.paymentPlan && (
              <section className="d-section">
                <h2>Payment plan</h2>
                <p className="d-desc">{p.paymentPlan}</p>
              </section>
            )}

            <section className="d-section">
              <h2>The developer</h2>
              <p className="d-dev">
                {dev ? <Link href={`/developers/${dev.id}`}>{p.developerName}</Link> : p.developerName}
                {dev?.verified && <span className="tag good">✓ Verified developer</span>}
              </p>
              <p className="muted">
                {dev?.devType ? `${devTypeLabel(dev.devType)}. ` : ""}
                Kolé sells this property on behalf of the developer. You deal with Kolé, and Kolé deals with the developer, so ask us anything in the chat, including for a live video tour.
              </p>
            </section>
          </div>

          <aside className="d-side">
            <div className="pricecard">
              <p className="pc-price">{naira(p.price)}</p>
              {p.priceNote && <p className="pc-note">{p.priceNote}</p>}
              <p className="pc-note">Listing last updated {shortDate(p.updatedAt)}. Prices can change, so confirm in writing before you pay.</p>
              <SaveButton propertyId={p.id} saved={savedIds(db, user).has(p.id)} label />
              {canManage(user, p) && (
                <Link className="btn plain wide" href={`/admin/properties/${p.id}`}>
                  Edit this listing
                </Link>
              )}
            </div>
            <div className="abroad">
              <b>Buying from abroad?</b>
              <p>Ask Kolé for a live video tour and the title documents in the chat, and never pay into a personal account.</p>
              <Link href="/guide">5 checks before you pay</Link>
            </div>
            <PropertyChat
              propertyId={p.id}
              viewer={user ? { role: user.role, name: user.name } : null}
            />
          </aside>
        </div>

        {similar.length > 0 && (
          <section className="d-similar">
            <div className="sec-head">
              <h2>Similar {p.type === "land" ? "plots" : "properties"}</h2>
            </div>
            <div className="grid">
              {similar.map((s) => (
                <div className="cell" key={s.id}>
                  <PropertyCard p={s} />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
