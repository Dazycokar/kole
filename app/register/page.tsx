import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import AuthForm from "@/components/AuthForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Create account" };

const safeNext = (n: unknown) => (typeof n === "string" && n.startsWith("/") && !n.startsWith("//") ? n : undefined);

export default async function Register({ searchParams }: { searchParams: { next?: string; role?: string } }) {
  if (searchParams.role === "developer") redirect("/partner");
  if (await getUser()) redirect(safeNext(searchParams.next) ?? "/dashboard");
  return (
    <main className="page">
      <div className="wrap authwrap">
        <div className="authcard">
          <h1>Create your account</h1>
          <p className="muted">Save the properties you like, see them in 3D, and chat with the Kolé team, who deal with the developers for you. Buyer accounts are free.</p>
          <AuthForm mode="register" next={safeNext(searchParams.next)} />
        </div>
      </div>
    </main>
  );
}
