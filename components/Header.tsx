import Link from "next/link";
import { getUser, isStaff } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { threadsFor } from "@/lib/queries";
import { SITE } from "@/lib/site";
import ThemeToggle from "./ThemeToggle";
import LogoutButton from "./LogoutButton";

const LINKS = [
  { href: "/buildings", label: "Buildings" },
  { href: "/lands", label: "Lands" },
  { href: "/top-buildings", label: "Top buildings" },
  { href: "/top-lands", label: "Top lands" },
  { href: "/areas", label: "Areas" },
  { href: "/developers", label: "Developers" },
  { href: "/about", label: "About" },
];

export default async function Header() {
  const user = await getUser();
  const staff = isStaff(user);

  let unread = 0;
  let saved = 0;
  if (user) {
    const db = await readDb();
    unread = threadsFor(db, user).reduce((n, t) => n + t.unread, 0);
    saved = db.saves.filter((s) => s.userId === user.id).length;
  }
  const messagesHref = staff ? "/admin/messages" : "/chat";
  const dashHref = staff ? "/admin" : "/dashboard";

  return (
    <header className="nav-pill">
      <Link className="brand" href="/" aria-label={`${SITE.name} home`}>
        {SITE.name}
        <b>.</b>
      </Link>

      <nav className="nav" aria-label="Main">
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href}>
            {l.label}
          </Link>
        ))}
      </nav>

      <div className="nav-end">
        {user ? (
          <details className="acct">
            <summary aria-label="Your account">
              <span className="avatar" aria-hidden="true">
                {user.name.trim().charAt(0).toUpperCase() || "K"}
              </span>
              <span className="acct-name">{user.name.split(" ")[0]}</span>
              {unread > 0 && <span className="dot">{unread}</span>}
            </summary>
            <div className="menu-list acct-list">
              <Link href={dashHref}>{staff ? "Team dashboard" : "My dashboard"}</Link>
              {!staff && <Link href="/saved">Saved properties{saved > 0 ? ` (${saved})` : ""}</Link>}
              <Link href={messagesHref}>Messages{unread > 0 ? ` (${unread})` : ""}</Link>
              <LogoutButton name={user.name} className="menu-out" />
            </div>
          </details>
        ) : (
          <>
            <Link className="pill-btn hide-sm" href="/login">
              Log in
            </Link>
            <Link className="pill-btn solid hide-sm" href="/register">
              Sign up
            </Link>
          </>
        )}

        <details className="menu">
          <summary aria-label="Open menu">Menu</summary>
          <div className="menu-list">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href}>
                {l.label}
              </Link>
            ))}
            <Link href="/guide">Buying from abroad</Link>
            {user ? (
              <>
                <Link href={dashHref}>{staff ? "Team dashboard" : "My dashboard"}</Link>
                {!staff && <Link href="/saved">Saved{saved > 0 ? ` (${saved})` : ""}</Link>}
                <Link href={messagesHref}>Messages{unread > 0 ? ` (${unread})` : ""}</Link>
              </>
            ) : (
              <>
                <Link href="/login">Log in</Link>
                <Link href="/register">Sign up</Link>
              </>
            )}
          </div>
        </details>
        <ThemeToggle />
      </div>
    </header>
  );
}
