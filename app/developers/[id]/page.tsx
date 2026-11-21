import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getUser } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { publishedOnly } from "@/lib/queries";
import { savedIds } from "@/lib/lists";
import { DEV_TYPES, devTypeLabel } from "@/lib/devtypes";
import PropertyCard from "@/components/PropertyCard";
import Reveal from "@/components/Reveal";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const db = await readDb();
  const d = db.users.find((u) => u.id === params.id && u.role === "developer");
  return { title: d ? d.company || d.name : "Developer" };
}

export default async function DeveloperPage({ params }: { params: { id: string } }) {
  const [db, user] = await Promise.all([readDb(), getUser()]);
  const d = db.users.find((u) => u.id === params.id && u.role === "developer" && u.status === "active");
  if (!d) notFound();
  const saved = savedIds(db, user);
  const list = publishedOnly(db).filter((p) => p.developerId === d.id).sort((a, b) => b.price - a.price);
  const blurb = DEV_TYPES.find((t) => t.id === d.devType)?.blurb;

  return (
    <main className="page" id="top">
      <div className="wrap">
        <Link href="/developers" className="back">
          ← All developers
        </Link>
        <div className="rank-head">
          <p className="kicker-d">{d.devType ? devTypeLabel(d.devType) : "Developer"}</p>
          <h1>{d.company || d.name}</h1>
          <p className="dev-tags">
            {d.verified ? <span className="tag good">✓ Verified by the Kolé admin</span> : <span className="tag">Approved to list, not yet verified</span>}
            {d.demo && <span className="tag">Sample developer</span>}
          </p>
          {d.about && <p>{d.about}</p>}
          {blurb && <p className="muted">{blurb}</p>}
          {d.rcNumber && (
            <p className="rank-stat">
              CAC registration: <b>{d.rcNumber}</b> · {d.verified ? "checked" : "given by the developer, not independently checked"}
            </p>
          )}
        </div>
        <div className="grid">
          {list.length === 0 && <div className="empty">No live listings from this developer right now.</div>}
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
