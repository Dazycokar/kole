import type { ReactNode } from "react";

const COPY = {
  register: {
    kicker: "Create your account",
    title: "Find it. See it. Ask us.",
    lead: "Property in Lagos and Abuja, shown the way it should be: in 3D, in video, with the documents spelled out.",
    points: [
      ["Save what you like", "Build a shortlist and come back to it from any device."],
      ["See before you fly", "3D views, walk-through videos and 360° tours of every listing."],
      ["One team, one chat", "Ask about price, papers and tours. Kolé deals with the developer for you."],
    ],
  },
  login: {
    kicker: "Welcome back",
    title: "Pick up where you left off.",
    lead: "Your shortlist and your chats with the Kolé team are waiting.",
    points: [
      ["Your shortlist", "Every property you saved, in one place."],
      ["Your chats", "See which Kolé team is looking after each property."],
    ],
  },
} as const;

/** Split layout for the login and sign-up pages: a brand panel on the left, the form on the right. */
export default function AuthShell({ mode, title, intro, children }: { mode: "login" | "register"; title: string; intro: string; children: ReactNode }) {
  const c = COPY[mode];
  return (
    <main className="page auth2-page">
      <div className="wrap">
        <div className="auth2">
          <aside className="auth2-art" aria-label="About Kolé">
            <div className="auth2-glow" aria-hidden="true" />
            <div className="auth2-stack" aria-hidden="true"><i /><i /><i /></div>
            <p className="auth2-kicker">{c.kicker}</p>
            <h2>{c.title}</h2>
            <p className="auth2-lead">{c.lead}</p>
            <ul>
              {c.points.map(([h, p]) => (
                <li key={h}>
                  <span className="auth2-tick" aria-hidden="true">✓</span>
                  <span><b>{h}</b><br />{p}</span>
                </li>
              ))}
            </ul>
          </aside>
          <section className="auth2-card">
            <h1>{title}</h1>
            <p className="muted">{intro}</p>
            {children}
          </section>
        </div>
      </div>
    </main>
  );
}
