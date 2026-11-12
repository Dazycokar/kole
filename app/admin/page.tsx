import { redirect } from "next/navigation";
import Link from "next/link";
import { getUser } from "@/lib/auth";
import { readDb } from "@/lib/db";
import ListingRow from "@/components/ListingRow";
import { RemoveSampleData } from "@/components/AdminActions";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const user = await getUser();
  if (!user) redirect("/login?next=/admin");
  const db = await readDb();
  const admin = user.role === "admin";
  if (user.role === "agent") redirect("/admin/messages");
  if (!admin) redirect("/dashboard");
  const mine = db.properties.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const sampleCount = admin ? db.properties.filter((p) => p.demo).length : 0;

  const stats: [string, number][] = [
    ["Listings", mine.length],
    ["Live on the site", mine.filter((p) => p.published).length],
    ["Houses", mine.filter((p) => p.type === "house").length],
    ["Land", mine.filter((p) => p.type === "land").length],
    ["Saved by clients", db.saves.filter((s) => mine.some((p) => p.id === s.propertyId)).length],
  ];

  return (
    <>
      <div className="stats">
        {stats.map(([k, v]) => (
          <div key={k} className="stat">
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </div>

      {sampleCount > 0 && <RemoveSampleData count={sampleCount} />}

      <div className="sec-head slim">
        <h2>{admin ? "All listings" : "Your listings"}</h2>
        <Link className="btn solid" href="/admin/properties/new">
          Add property
        </Link>
      </div>

      {mine.length === 0 ? (
        <div className="empty">
          You have no listings yet. <Link href="/admin/properties/new">Add your first property</Link>.
        </div>
      ) : (
        <div className="tablewrap">
          <table className="atable">
            <thead>
              <tr>
                <th>Property</th>
                <th>Price</th>
                <th>Availability</th>
                <th>Visibility</th>
                <th>
                  <span className="sr">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {mine.map((p) => (
                <ListingRow key={p.id} p={p} isAdmin={admin} interest={db.saves.filter((s) => s.propertyId === p.id).length} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
