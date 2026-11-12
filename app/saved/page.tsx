import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { readDb } from "@/lib/db";
import PropertyCard from "@/components/PropertyCard";
import Reveal from "@/components/Reveal";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Saved properties" };

export default async function Saved() {
  const user = await getUser();
  if (!user) redirect("/login?next=/saved&why=save");
  const db = await readDb();
  const mine = db.saves
    .filter((s) => s.userId === user.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((s) => db.properties.find((p) => p.id === s.propertyId && p.published))
    .filter((p): p is NonNullable<typeof p> => !!p);

  return (
    <main className="page" id="top">
      <div className="wrap">
        <div className="sec-head">
          <h2>Your shortlist</h2>
          <p>
            Hello {user.name.split(" ")[0]}. These are the properties you picked. Open one to see it in 3D or to ask the Kolé team about it.
          </p>
        </div>
        {mine.length === 0 ? (
          <div className="empty">
            You have not saved anything yet. Tap the heart on any building or plot to keep it here.
            <div className="more-row">
              <Link className="btn solid" href="/top-buildings">
                See top buildings
              </Link>
              <Link className="btn plain" href="/top-lands" style={{ marginLeft: 10 }}>
                See top lands
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid">
            {mine.map((p, i) => (
              <Reveal key={p.id} delay={(i % 3) * 90} className="cell">
                <PropertyCard p={p} saved />
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
