import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";
import { PH } from "@/lib/seed";
import Photo from "@/components/Photo";
import Reveal from "@/components/Reveal";

export const metadata: Metadata = { title: "About" };

const STEPS = [
  { t: "Look", d: "Browse buildings and land in Lagos and Abuja. Open any listing in 3D, or in a 360° tour where one is available." },
  { t: "Ask", d: "Save the ones you like and ask the Kolé team about them: price, documents, a live video tour or an inspection." },
  { t: "Check", d: "We show which title documents the developer says they hold. A tick means our team has seen them. Your own lawyer still does the final check." },
  { t: "Decide", d: "We deal with the developer and bring you the answers, so you never have to chase anyone yourself." },
];

const VALUES = [
  { t: "One point of contact", d: "Buyers talk to Kolé. Developers talk to Kolé. Nobody is left guessing who to call." },
  { t: "Papers before money", d: "Every listing says what documents exist, what stage the building is at and what the payment plan is, before you are asked to pay anything." },
  { t: "Honest about limits", d: "This website takes no payments and gives no legal advice. We say clearly what has been checked and what has not." },
];

export default function About() {
  return (
    <main className="page" id="top">
      <div className="wrap">
        <div className="about-hero">
          <Photo photo={{ src: PH.h3, alt: "A luxury home in Lagos" }} sizes="100vw" priority />
          <span className="card-shade" aria-hidden="true" />
          <div className="about-hero-in">
            <p className="kicker-d on-dark">About {SITE.name}</p>
            <h1>The go-between for buyers and developers.</h1>
          </div>
        </div>

        <section className="about-grid">
          <Reveal className="about-text">
            <h2>Why Kolé exists</h2>
            <p>Buying a building or a plot in Nigeria can be hard, most of all when you live abroad. You cannot walk the site, you do not know who to trust, and the papers are easy to get wrong. Developers have the opposite problem: good projects, but buyers who hesitate because they cannot see or check anything.</p>
            <p>Kolé sits between the two. We list developers&apos; buildings and land across Lagos Island, the Lekki axis and the luxury districts of Abuja. Buyers see them clearly and ask us anything. We take the questions to the developer and bring back the answers.</p>
            <p>
              The name comes from the Yoruba <i>kọ́lé</i>, to build a house.
            </p>
          </Reveal>
          <Reveal delay={120} className="about-side">
            <h3>Who does what</h3>
            <dl>
              <dt>Buyers</dt>
              <dd>Sign up free, save properties, see them in 3D and chat with Kolé from their own dashboard.</dd>
              <dt>Developers</dt>
              <dd>Do not need an account. They send us a partner request and our team lists their property.</dd>
              <dt>The Kolé team</dt>
              <dd>Lists the properties, checks documents, answers buyers and speaks to developers.</dd>
            </dl>
          </Reveal>
        </section>

        <section className="about-block">
          <div className="sec-head">
            <h2>How it works</h2>
            <p>Four steps from the first look to a decision.</p>
          </div>
          <div className="steps4" role="list">
            {STEPS.map((s, i) => (
              <Reveal key={s.t} delay={i * 80}>
                <div className="step" role="listitem">
                  <span className="cn">{String(i + 1).padStart(2, "0")}</span>
                  <h3>{s.t}</h3>
                  <p>{s.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="about-block">
          <div className="sec-head">
            <h2>What we stand for</h2>
          </div>
          <div className="dtypes">
            {VALUES.map((v, i) => (
              <Reveal key={v.t} delay={i * 80}>
                <div className="dtype static">
                  <b>{v.t}</b>
                  <span>{v.d}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="about-block">
          <div className="guide-box">
            <h2>Ready to start?</h2>
            <p className="muted">Buyers can create a free account in a minute. Developers can send us a partner request.</p>
            <div className="cta">
              <Link className="btn solid" href="/register">
                Create a buyer account
              </Link>
              <Link className="btn plain" href="/partner">
                Partner with Kolé
              </Link>
              <Link className="btn plain" href="/guide">
                Buying from abroad
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
