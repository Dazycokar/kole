import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getUser, isStaff } from "@/lib/auth";
import { readDb, storageMode } from "@/lib/db";
import { staffUnreadTotal } from "@/lib/queries";
import AdminNav from "@/components/AdminNav";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: { default: "Dashboard", template: "%s | Dashboard" } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  if (!user) redirect("/login?next=/admin");
  if (!isStaff(user)) redirect(user.role === "client" ? "/dashboard" : "/");

  const db = await readDb();
  const unread = staffUnreadTotal(db, user);
  const pending = user.role !== "admin" ? 0 : db.partnerRequests.filter((r) => !r.handled).length;

  return (
    <main className="page" id="top">
      <div className="wrap">
        <AdminNav unread={unread} pending={pending} name={user.name} isAdmin={user.role === "admin"} team={db.teams.find((t) => t.id === user.teamId)?.name} />
        {storageMode === "temp" && user.role === "admin" && (
          <p className="notice warn" role="alert">
            No database is connected, so anything you add here will disappear when Vercel restarts the site. Add a Postgres database (Vercel → Storage → Neon) and set DATABASE_URL, then redeploy. See the README.
          </p>
        )}
        {children}
      </div>
    </main>
  );
}
