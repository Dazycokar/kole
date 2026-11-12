import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getUser, isAdmin } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { AgentActions, NewAgentForm, NewTeamForm, TeamActions } from "@/components/TeamAdmin";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Teams" };

export default async function Teams() {
  const user = await getUser();
  if (!isAdmin(user)) redirect("/admin");
  const db = await readDb();
  const teams = db.teams.slice().sort((a, b) => a.name.localeCompare(b.name));
  const options = teams.map((t) => ({ id: t.id, name: t.name }));
  const unassigned = db.threads.filter((t) => !t.teamId && db.messages.some((m) => m.threadId === t.id)).length;

  return (
    <>
      <div className="sec-head slim">
        <h2>Teams</h2>
        <p>
          Each team has its own name and logins. A new enquiry goes to the team that covers the property&apos;s area, and the buyer sees that team&apos;s name in the chat.
          Team members only see their own team&apos;s conversations. You see all of them and can move a conversation to another team from the chat.
        </p>
      </div>

      {unassigned > 0 && <p className="notice">{unassigned} {unassigned === 1 ? "conversation has" : "conversations have"} no team yet. Open it in Messages and choose a team.</p>}

      {teams.length === 0 && <div className="empty">No teams yet. Add your first team below, then add its members.</div>}

      {teams.map((t) => {
        const agents = db.users.filter((u) => u.role === "agent" && u.teamId === t.id);
        const chats = db.threads.filter((x) => x.teamId === t.id).length;
        return (
          <section className="dsec" key={t.id}>
            <div className="dsec-head">
              <h2>{t.name}</h2>
              <TeamActions id={t.id} name={t.name} canDelete={agents.length === 0} />
            </div>
            <p className="muted">
              {t.focus || "No description"} · {t.areas.length ? `Covers ${t.areas.join(", ")}` : "Takes any area"} · {chats} {chats === 1 ? "client chat" : "client chats"}
            </p>
            {agents.length > 0 && (
              <div className="tablewrap">
                <table className="atable">
                  <thead><tr><th>Member</th><th>Login</th><th>Status</th><th>Manage</th></tr></thead>
                  <tbody>
                    {agents.map((a) => (
                      <tr key={a.id}>
                        <td data-label="Member">{a.name}</td>
                        <td data-label="Login">{a.email}</td>
                        <td data-label="Status">{a.status === "active" ? "Active" : "Suspended"}</td>
                        <td data-label="Manage"><AgentActions id={a.id} status={a.status} teams={options} teamId={t.id} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <NewAgentForm teamId={t.id} />
          </section>
        );
      })}

      <section className="dsec">
        <div className="dsec-head"><h2>Add a team</h2></div>
        <NewTeamForm />
      </section>
    </>
  );
}
