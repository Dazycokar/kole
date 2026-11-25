import Link from "next/link";

export default function NotFound() {
  return (
    <main className="page">
      <div className="wrap authwrap">
        <div className="authcard">
          <h1>Page not found</h1>
          <p className="muted">That page does not exist, or the listing has been removed.</p>
          <div className="cta">
            <Link className="btn solid" href="/properties">
              Browse properties
            </Link>
            <Link className="btn plain" href="/">
              Home
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
