import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Buying from abroad" };

const CHECKS: { t: string; d: string }[] = [
  { t: "Ask for the documents, then have your own lawyer check them", d: "A payment receipt is not proof of ownership. Ask for the Certificate of Occupancy, Governor's Consent or registered Deed of Assignment, and the survey plan. Use a lawyer you chose yourself, not one the seller recommends, to search the title at the land registry." },
  { t: "Do not rely on one person on the ground alone", d: "A relative or friend who visits for you can mean well and still miss things. Ask for a live video tour of the property and the surrounding road, and use a licensed professional for the legal checks." },
  { t: "Pay safely, and never into a personal account", d: "Pay only to the account named in your written agreement, and have your lawyer confirm it matches the seller in the documents. For off-plan homes, ask for the payment plan in writing and whether payments are held by a lawyer or in escrow until each construction stage is done." },
  { t: "Check the developer, not just the flyer", d: "Look at what they have really delivered, ask to visit a finished project if you can, and check the CAC registration number. Urgent discounts and pressure to pay today are a reason to slow down." },
  { t: "Know the delivery and price risks", d: "Building costs and the naira move, and some developers revise prices mid-project. Get the price, stage dates and handover month in writing, and ask what happens if the date slips." },
];

export default function Guide() {
  return (
    <main className="page" id="top">
      <div className="wrap narrow">
        <div className="rank-head">
          <p className="kicker-d">For buyers abroad</p>
          <h1>5 checks before you pay</h1>
          <p>Buying in Lagos or Abuja from another country is easier when you do these in order. Kolé is the go-between: you deal with Kolé and we deal with the developer. This website does not take payments, and it does not replace your own lawyer.</p>
        </div>
        <ol className="checks-list">
          {CHECKS.map((c, i) => (
            <li key={c.t}>
              <span className="cn">{String(i + 1).padStart(2, "0")}</span>
              <div>
                <h2>{c.t}</h2>
                <p>{c.d}</p>
              </div>
            </li>
          ))}
        </ol>
        <section className="guide-box">
          <h2>How Kolé helps</h2>
          <ul>
            <li>Every listing opens in 3D, and some have a 360° tour, so you can look around before you ask for a video call.</li>
            <li>Each listing shows which documents the developer says they can show, and a tick when the Kolé team has seen them.</li>
            <li>The chat goes to the Kolé team, with ready questions for a video tour, copies of the documents and how payments are held.</li>
            <li>You can tell Kolé where you live, so we can offer a call at a sensible hour for you.</li>
          </ul>
          <p className="muted small">This page is general information, not legal advice. Always use a qualified Nigerian lawyer for the final checks.</p>
          <div className="cta">
            <Link className="btn solid" href="/top-buildings">
              See top buildings
            </Link>
            <Link className="btn plain" href="/register">
              Create a free buyer account
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
