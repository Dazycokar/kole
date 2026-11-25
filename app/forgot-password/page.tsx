import type { Metadata } from "next";
import PasswordResetForm from "@/components/PasswordResetForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Forgot password", robots: { index: false, follow: false } };

export default function ForgotPassword() {
  return (
    <main className="page">
      <div className="wrap authwrap">
        <section className="authcard reset-card">
          <h1>Forgot your password?</h1>
          <p className="muted">Enter the email address for your buyer account and we’ll send a reset link if it’s eligible.</p>
          <PasswordResetForm mode="request" />
        </section>
      </div>
    </main>
  );
}
