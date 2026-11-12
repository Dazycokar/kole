import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getUser } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { canManage } from "@/lib/queries";
import PropertyForm from "@/components/PropertyForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Edit property" };

export default async function EditProperty({ params }: { params: { id: string } }) {
  const user = await getUser();
  if (!user) redirect("/login?next=/admin");
  const db = await readDb();
  const developers = db.users.filter((u) => u.role === "developer").map((u) => ({ id: u.id, name: u.company || u.name })).sort((a, b) => a.name.localeCompare(b.name));
  const p = db.properties.find((x) => x.id === params.id);
  if (!p || !canManage(user, p)) notFound();
  return (
    <>
      <div className="sec-head slim">
        <h2>Edit property</h2>
      </div>
      <PropertyForm initial={p} isAdmin developers={developers} />
    </>
  );
}
