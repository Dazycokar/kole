import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getUser, isAdmin } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { timeAgo } from "@/lib/format";
import { devTypeLabel } from "@/lib/devtypes";
import { DeveloperForm, DeveloperRow, RequestRow } from "@/components/DeveloperAdmin";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Developers" };

export default async function Developers() {
  const user = await getUser();
  if (!isAdmin(user)) redirect("/admin");
  const db = await readDb();
  const devs = db.users.filter((u) => u.role === "developer").sort((a, b) => Number(!!a.demo) - Number(!!b.demo) || b.createdAt.localeCompare(a.createdAt));
  const reqs = db.partnerRequests.slice().sort((a, b) => Number(a.handled) - Number(b.handled) || b.createdAt.localeCompare(a.createdAt));

  return (
    <>
      <div className="sec-head slim">
        <h2>Partner requests</h2>
        <p>Developers do not log in. They send a request from the Partner page, and you list their property for them.</p>
      </div>
      {reqs.length === 0 ? (
        <div className="empty">No requests yet.</div>
      ) : (
        <div className="reqs">
          {reqs.map((r) => (
            <article key={r.id} className={`req${r.handled ? " done" : ""}`}>
              <div>
                <b>{r.company}</b> <span className="muted">· {r.name} · {timeAgo(r.createdAt)}</span>
                <p>{r.message}</p>
                <p className="muted small">
                  {r.email}
                  {r.phone ? ` · ${r.phone}` : ""}
                </p>
              </div>
              <RequestRow id={r.id} handled={r.handled} />
            </article>
          ))}
        </div>
      )}

      <div className="sec-head slim" style={{ marginTop: 40 }}>
        <h2>Developers we work with</h2>
        <p>Add a developer here first, then pick them when you add a property. Only the name, kind and about text are public.</p>
      </div>
      <div className="devpanel">
        <h3>Add a developer</h3>
        <DeveloperForm />
      </div>

      {devs.length > 0 && (
        <div className="tablewrap">
          <table className="atable">
            <thead>
              <tr>
                <th>Developer</th>
                <th>Private contact</th>
                <th>Listings</th>
                <th>
                  <span className="sr">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {devs.map((d) => {
                const n = db.properties.filter((p) => p.developerId === d.id).length;
                return (
                  <tr key={d.id}>
                    <td>
                      <b>{d.company || d.name}</b>
                      {d.demo && <span className="tag"> Sample</span>}
                      <p className="muted small">
                        {devTypeLabel(d.devType) || "Kind not set"}
                        {d.rcNumber ? ` · CAC ${d.rcNumber}` : " · no CAC number"}
                      </p>
                    </td>
                    <td>
                      {d.demo ? <span className="muted">—</span> : (
                        <>
                          {d.name !== d.company ? d.name : ""}
                          <p className="muted small">{[d.phone, d.contactEmail].filter(Boolean).join(" · ") || "No contact saved"}</p>
                        </>
                      )}
                    </td>
                    <td className="num">{n}</td>
                    <td>
                      <DeveloperRow
                        listings={n}
                        values={{
                          id: d.id, company: d.company ?? d.name, devType: d.devType ?? "", about: d.about ?? "", rcNumber: d.rcNumber ?? "",
                          contactName: d.name !== d.company ? d.name : "", phone: d.phone ?? "", contactEmail: d.contactEmail ?? "", verified: !!d.verified,
                        }}
                      />
                    </td>
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
