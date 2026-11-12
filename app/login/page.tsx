import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import AuthForm from "@/components/AuthForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Log in" };

const safeNext = (n: unknown) => (typeof n === "string" && n.startsWith("/") && !n.startsWith("//") ? n : undefined);

export default async function Login({ searchParams }: { searchParams: { next?: string; why?: string } }) {
  if (await getUser()) redirect(safeNext(searchParams.next) ?? "/dashboard");
  return (
    <main className="page">
      <div className="wrap authwrap">
        <div className="authcard">
          <h1>Log in</h1>
          <p className="muted">{searchParams.why === "save" ? "Log in to save properties to your shortlist and ask the Kolé team about them." : "Log in to your buyer dashboard to see your shortlist and your chats with the Kolé team."}</p>
          <AuthForm mode="login" next={safeNext(searchParams.next)} />
        </div>
      </div>
    </main>
  );
}
