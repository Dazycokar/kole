"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface Props {
  unread: number;
  pending: number;
  name: string;
  isAdmin: boolean;
  team?: string;
}

export default function AdminNav({ unread, pending, name, isAdmin, team }: Props) {
  const path = usePathname();
  const items = [
    { href: "/admin", label: "Listings", on: path === "/admin" || (path.startsWith("/admin/properties") && !path.endsWith("/new")), badge: 0 },
    { href: "/admin/properties/new", label: "Add property", on: path.endsWith("/new"), badge: 0 },
    { href: "/admin/messages", label: "Messages", on: path.startsWith("/admin/messages"), badge: unread },
    { href: "/admin/developers", label: "Developers", on: path.startsWith("/admin/developers"), badge: pending },
    { href: "/admin/buyers", label: "Buyers", on: path.startsWith("/admin/buyers"), badge: 0 },
    { href: "/admin/team", label: "Teams", on: path.startsWith("/admin/team"), badge: 0 },
  ];
  const visible = isAdmin ? items : items.filter((i) => i.href === "/admin/messages");
  return (
    <div className="adminnav">
      <div>
        <p className="an-kicker">{isAdmin ? "Kolé team dashboard" : team ? `${team} · Kolé` : "Kolé team"}</p>
        <p className="an-name">{name}</p>
      </div>
      <nav aria-label="Dashboard">
        {visible.map((i) => (
          <Link key={i.href} href={i.href} className="chip" data-on={i.on} aria-current={i.on ? "page" : undefined}>
            {i.label}
            {i.badge > 0 && <span className="dot">{i.badge}</span>}
          </Link>
        ))}
      </nav>
    </div>
  );
}
