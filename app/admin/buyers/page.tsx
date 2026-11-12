import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser, isAdmin } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { timeAgo } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Buyers" };

export default async function Buyers() {
  const user = await getUser();
  if (!isAdmin(user)) redirect("/admin");
  const db = await readDb();
  const buyers = db.users.filter((u) => u.role === "client").sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return (
    <>
      <div className="sec-head slim">
        <h2>Buyers</h2>
        <p>Everyone who signed up, what they saved and who they have asked about. Use it to follow up warm leads.</p>
      </div>
      {buyers.length === 0 ? (
        <div className="empty">No buyers have signed up yet.</div>
      ) : (
        <div className="tablewrap">
          <table className="atable">
            <thead>
              <tr>
                <th>Buyer</th>
                <th>Contact</th>
                <th>Saved</th>
                <th>Chats</th>
              </tr>
            </thead>
            <tbody>
              {buyers.map((b) => {
                const saves = db.saves.filter((s) => s.userId === b.id);
                const threads = db.threads.filter((t) => t.clientId === b.id && db.messages.some((m) => m.threadId === t.id));
                return (
                  <tr key={b.id}>
                    <td>
                      <b>{b.name}</b>
                      <p className="muted small">
                        {b.country ? `${b.country} · ` : ""}joined {timeAgo(b.createdAt)}
                      </p>
                    </td>
                    <td>
                      {b.email}
                      {b.phone && <p className="muted small">{b.phone}</p>}
                    </td>
                    <td>
                      {saves.length === 0 ? <span className="muted">—</span> : (
                        <ul className="mini">
                          {saves.slice(0, 4).map((s) => {
                            const p = db.properties.find((x) => x.id === s.propertyId);
                            return p ? (
                              <li key={s.propertyId}>
                                <Link href={`/properties/${p.id}`}>{p.title}</Link>
                              </li>
                            ) : null;
                          })}
                          {saves.length > 4 && <li className="muted">+{saves.length - 4} more</li>}
                        </ul>
                      )}
                    </td>
                    <td className="num">{threads.length}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
