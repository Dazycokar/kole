import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getUser, isAdmin } from "@/lib/auth";
import { readDb } from "@/lib/db";
import PropertyForm from "@/components/PropertyForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Add property" };

export default async function NewProperty() {
  const user = await getUser();
  if (!isAdmin(user)) redirect(user ? "/admin" : "/login?next=/admin/properties/new");
  const db = await readDb();
  const developers = db.users.filter((u) => u.role === "developer").map((u) => ({ id: u.id, name: u.company || u.name })).sort((a, b) => a.name.localeCompare(b.name));
  return (
    <>
      <div className="sec-head slim">
        <h2>Add a property</h2>
      </div>
      <PropertyForm isAdmin developers={developers} />
    </>
  );
}
