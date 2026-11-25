import type { Metadata } from "next";
import ContactForm from "@/components/ContactForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Contact" };

/** Contact details come from .env so you can change them without touching code. */
export default function Contact({ searchParams }: { searchParams: { topic?: string; property?: string } }) {
  const phone = process.env.CONTACT_PHONE;
  const whatsapp = process.env.CONTACT_WHATSAPP?.replace(/[^\d]/g, "");
  const email = process.env.CONTACT_EMAIL || process.env.CONTACT_TO || process.env.ADMIN_EMAIL;
  const address = process.env.CONTACT_ADDRESS;
  const hours = process.env.CONTACT_HOURS || "Monday to Friday, 9am to 6pm (Lagos time)";
  return (
    <main className="page" id="top">
      <div className="wrap">
        <div className="rank-head">
          <p className="kicker-d">Contact</p>
          <h1>Talk to the Kolé team</h1>
          <p>Questions about a property, documents, a viewing, or listing your own? Send a message and a real person replies. You can also chat on any property page once you are signed in.</p>
        </div>
        <div className="contact-grid">
          <div className="authcard">
            <ContactForm propertyId={searchParams.property} defaultTopic={searchParams.topic} />
          </div>
          <aside className="contact-side" aria-label="Other ways to reach us">
            <h2>Other ways to reach us</h2>
            <dl>
              {email && <><dt>Email</dt><dd><a href={`mailto:${email}`}>{email}</a></dd></>}
              {phone && <><dt>Phone</dt><dd><a href={`tel:${phone.replace(/[^\d+]/g, "")}`}>{phone}</a></dd></>}
              {whatsapp && <><dt>WhatsApp</dt><dd><a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer">Message us on WhatsApp</a></dd></>}
              {address && <><dt>Office</dt><dd>{address}</dd></>}
              <dt>Hours</dt><dd>{hours}</dd>
            </dl>
            {!email && !phone && !whatsapp && !address && <p className="muted small">Add CONTACT_EMAIL, CONTACT_PHONE, CONTACT_WHATSAPP and CONTACT_ADDRESS to your .env to show them here.</p>}
          </aside>
        </div>
      </div>
    </main>
  );
}
