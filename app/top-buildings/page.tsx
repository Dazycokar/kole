import type { Metadata } from "next";
import Link from "next/link";
import { getUser } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { publishedOnly } from "@/lib/queries";
import { savedIds, topBuildings } from "@/lib/lists";
import { nairaShort } from "@/lib/format";
import PropertyCard from "@/components/PropertyCard";
import Reveal from "@/components/Reveal";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Top buildings" };

export default async function TopBuildings() {
  const [db, user] = await Promise.all([readDb(), getUser()]);
  const saved = savedIds(db, user);
  const list = topBuildings(publishedOnly(db), 10);
  return (
    <main className="page" id="top">
      <div className="wrap">
        <div className="rank-head">
          <p className="kicker-d">The ranking</p>
          <h1>Top buildings</h1>
          <p>The most expensive houses for sale on Kolé, ranked by asking price. It updates itself whenever Kolé lists or reprices a building.</p>
          {list.length > 0 && (
            <p className="rank-stat">
              <b>{nairaShort(list[0].price)}</b> at number one · <b>{nairaShort(list[list.length - 1].price)}</b> to make the list
            </p>
          )}
        </div>
        {list.length === 0 ? (
          <div className="empty">No buildings are listed for sale yet.</div>
        ) : (
          <div className="grid">
            {list.map((p, i) => (
              <Reveal key={p.id} delay={(i % 3) * 90} className={`cell${i === 0 ? " span2" : ""}`}>
                <PropertyCard p={p} rank={i + 1} saved={saved.has(p.id)} />
              </Reveal>
            ))}
          </div>
        )}
        <div className="more-row">
          <Link className="btn plain" href="/buildings">
            Browse every building
          </Link>
        </div>
      </div>
    </main>
  );
}
