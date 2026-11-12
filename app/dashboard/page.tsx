import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser, isStaff } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { threadsFor } from "@/lib/queries";
import { timeAgo } from "@/lib/format";
import PropertyCard from "@/components/PropertyCard";
import ProfileForm from "@/components/ProfileForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "My dashboard" };

export default async function Dashboard() {
  const user = await getUser();
  if (!user) redirect("/login?next=/dashboard");
  if (isStaff(user)) redirect("/admin");
  const db = await readDb();

  const savedList = db.saves
    .filter((s) => s.userId === user.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((s) => db.properties.find((p) => p.id === s.propertyId && p.published))
    .filter((p): p is NonNullable<typeof p> => !!p);
  const threads = threadsFor(db, user).filter((t) => t.lastMessage);
  const teamsAttending: { name: string; focus: string; properties: string[] }[] = [];
  for (const t of threads) {
    if (!t.teamId || !t.teamName) continue;
    let g = teamsAttending.find((x) => x.name === t.teamName);
    if (!g) {
      g = { name: t.teamName, focus: db.teams.find((x) => x.id === t.teamId)?.focus ?? "", properties: [] };
      teamsAttending.push(g);
    }
    g.properties.push(t.propertyTitle);
  }
  const unread = threads.reduce((n, t) => n + t.unread, 0);
  const first = user.name.split(" ")[0];

  return (
    <main className="page" id="top">
      <div className="wrap">
        <div className="rank-head">
          <p className="kicker-d">Your dashboard</p>
          <h1>Hello, {first}</h1>
          <p>Your shortlist, your chats with the Kolé team and your details, in one place.</p>
        </div>

        <div className="dstats">
          <Link href="/saved"><b>{savedList.length}</b><span>saved properties</span></Link>
          <Link href="/chat"><b>{threads.length}</b><span>{threads.length === 1 ? "conversation" : "conversations"}</span></Link>
          <Link href="/chat"><b>{unread}</b><span>unread {unread === 1 ? "reply" : "replies"}</span></Link>
        </div>

        <section className="dsec">
          <div className="dsec-head">
            <h2>Your shortlist</h2>
            {savedList.length > 0 && <Link href="/saved">See all</Link>}
          </div>
          {savedList.length === 0 ? (
            <div className="empty">
              Nothing saved yet. Tap the heart on any property to keep it here.
              <div className="more-row">
                <Link className="btn solid" href="/top-buildings">Top buildings</Link>
                <Link className="btn plain" href="/top-lands" style={{ marginLeft: 10 }}>Top lands</Link>
              </div>
            </div>
          ) : (
            <div className="grid">
              {savedList.slice(0, 3).map((p) => (
                <div className="cell" key={p.id}>
                  <PropertyCard p={p} saved />
                </div>
              ))}
            </div>
          )}
        </section>

        {teamsAttending.length > 0 && (
          <section className="dsec">
            <div className="dsec-head"><h2>Teams attending to you</h2></div>
            <ul className="teamlist">
              {teamsAttending.map((t) => (
                <li key={t.name}>
                  <span className="team-badge">{t.name}</span>
                  {t.focus && <small>{t.focus}</small>}
                  <small>On: {t.properties.join(" · ")}</small>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="dsec">
          <div className="dsec-head">
            <h2>Your chats with Kolé</h2>
            {threads.length > 0 && <Link href="/chat">Open all</Link>}
          </div>
          {threads.length === 0 ? (
            <div className="empty">No chats yet. Open any property and ask the Kolé team about it: price, documents, a live video tour or an inspection.</div>
          ) : (
            <ul className="tlist">
              {threads.slice(0, 5).map((t) => (
                <li key={t.id}>
                  <Link href={`/chat?thread=${t.id}`}>
                    <span className="t-main">
                      <b>{t.propertyTitle}</b>
                      <small className="muted">{t.propertyArea}</small>
                      <span className="muted">{t.lastMessage?.mine ? "You: " : `${t.teamName ?? "Kolé"}: `}{t.lastMessage?.body.slice(0, 90)}</span>
                    </span>
                    <span className="t-meta">
                      {t.unread > 0 && <span className="dot">{t.unread}</span>}
                      <small className="muted">{timeAgo(t.updatedAt)}</small>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="dsec">
          <div className="dsec-head"><h2>Your account</h2></div>
          <ProfileForm name={user.name} phone={user.phone ?? ""} country={user.country ?? ""} email={user.email} />
        </section>
      </div>
    </main>
  );
}
