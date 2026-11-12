import type { Metadata } from "next";
import PartnerForm from "@/components/PartnerForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Partner with Kolé" };

export default function Partner() {
  return (
    <main className="page" id="top">
      <div className="wrap narrow">
        <div className="rank-head">
          <p className="kicker-d">For developers</p>
          <h1>Let Kolé sell for you</h1>
          <p>Developers do not need an account. Tell us what you are building, and the Kolé team lists it with photos, a 3D view and the documents buyers ask for. Buyers talk to Kolé, and we bring you the serious ones.</p>
        </div>
        <div className="authcard">
          <PartnerForm />
        </div>
      </div>
    </main>
  );
}
