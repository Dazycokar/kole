import type { Metadata } from "next";
import PasswordResetForm from "@/components/PasswordResetForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Reset password", robots: { index: false, follow: false } };

export default function ResetPassword({ searchParams }: { searchParams: { token?: string } }) {
  return (
    <main className="page">
      <div className="wrap authwrap">
        <section className="authcard reset-card">
          <h1>Set a new password</h1>
          <p className="muted">Choose a new password for your buyer account.</p>
          <PasswordResetForm mode="reset" token={searchParams.token} />
        </section>
      </div>
    </main>
  );
}
