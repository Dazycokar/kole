"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AREAS } from "@/lib/areas";
import { nairaShort } from "@/lib/format";
import { sized } from "@/lib/img";

type Tab = "all" | "sale" | "rent" | "land";
interface Hit {
  id: string; title: string; area: string; city: string; type: string; purpose: string; price: number; photo: string;
}

const TABS: [Tab, string][] = [["all", "All"], ["sale", "Buy"], ["rent", "Rent"], ["land", "Land"]];
const PRICES: [string, string][] = [
  ["", "Any price"], ["100000000", "Up to ₦100M"], ["250000000", "Up to ₦250M"], ["500000000", "Up to ₦500M"],
  ["1000000000", "Up to ₦1B"], ["2000000000", "Up to ₦2B"],
];
const ALL_AREAS = [...AREAS.Lagos, ...AREAS.Abuja];

/** The search box on the hero photo. It counts matches as you type and suggests listings you can open straight away. */
export default function HeroSearch() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("all");
  const [q, setQ] = useState("");
  const [city, setCity] = useState("");
  const [area, setArea] = useState("");
  const [max, setMax] = useState("");
  const [count, setCount] = useState<number | null>(null);
  const [hits, setHits] = useState<Hit[]>([]);
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(-1);
  const box = useRef<HTMLFormElement>(null);

  const params = () => {
    const p = new URLSearchParams();
    if (q.trim()) p.set("q", q.trim());
    if (city) p.set("city", city);
    if (area) p.set("area", area);
    if (max) p.set("max", max);
    if (tab === "sale" || tab === "rent") p.set("purpose", tab);
    if (tab === "land") p.set("type", "land");
    return p;
  };

  useEffect(() => {
    const ctl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/search?${params().toString()}`, { signal: ctl.signal });
        if (!r.ok) return;
        const j = await r.json();
        setCount(j.count);
        setHits(j.items);
        setCursor(-1);
      } catch {
        /* aborted or offline: keep what we had */
      }
    }, 220);
    return () => { clearTimeout(t); ctl.abort(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, q, city, area, max]);

  useEffect(() => {
    const away = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", away);
    return () => document.removeEventListener("mousedown", away);
  }, []);

  function submit(e?: React.FormEvent) {
    e?.preventDefault();
    if (cursor >= 0 && hits[cursor]) { router.push(`/properties/${hits[cursor].id}`); return; }
    const p = params();
    if (tab === "land") {
      p.delete("type");
      router.push(`/lands${p.toString() ? `?${p}` : ""}`);
    } else {
      router.push(`/search${p.toString() ? `?${p}` : ""}`);
    }
  }

  const showList = open && hits.length > 0;
  const areasShown = city ? AREAS[city as "Lagos" | "Abuja"] : ALL_AREAS;

  return (
    <form className="hsearch" ref={box} onSubmit={submit} role="search" aria-label="Search properties">
      <div className="hs-tabs" role="tablist" aria-label="What are you looking for">
        {TABS.map(([t, label]) => (
          <button key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => setTab(t)}>
            {label}
          </button>
        ))}
      </div>
      <div className="hs-row">
        <div className="hs-q">
        <label>
          <span className="sr">Search by area, street or keyword</span>
          <input
            value={q}
            onChange={(e) => { setQ(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") { e.preventDefault(); setOpen(true); setCursor((c) => Math.min(hits.length - 1, c + 1)); }
              if (e.key === "ArrowUp") { e.preventDefault(); setCursor((c) => Math.max(-1, c - 1)); }
              if (e.key === "Escape") setOpen(false);
            }}
            placeholder="Try Ikoyi, Maitama, penthouse, pool…"
            autoComplete="off"
            role="combobox"
            aria-expanded={showList}
            aria-controls="hs-list"
          />
        </label>
              {showList && (
        <ul className="hs-list" id="hs-list" role="listbox">
          {hits.map((h, n) => (
            <li key={h.id} role="option" aria-selected={n === cursor}>
              <Link href={`/properties/${h.id}`} className={n === cursor ? "cur" : undefined}>
                <span className="hs-th">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {h.photo && <img src={sized(h.photo, 160)} alt="" loading="lazy" />}
                </span>
                <span className="hs-t">
                  <b>{h.title}</b>
                  <small>{h.area}, {h.city} · {h.type === "land" ? "Land" : h.purpose === "rent" ? "For rent" : "For sale"}</small>
                </span>
                <span className="hs-p">{nairaShort(h.price)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

        </div>
        <label className="hs-f">
          <span>City</span>
          <select value={city} onChange={(e) => { setCity(e.target.value); setArea(""); }}>
            <option value="">Lagos and Abuja</option>
            <option value="Lagos">Lagos</option>
            <option value="Abuja">Abuja</option>
          </select>
        </label>
        <label className="hs-f">
          <span>Area</span>
          <select value={area} onChange={(e) => setArea(e.target.value)}>
            <option value="">Any area</option>
            {areasShown.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </label>
        <label className="hs-f">
          <span>Budget</span>
          <select value={max} onChange={(e) => setMax(e.target.value)}>
            {PRICES.map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </label>
        <button type="submit" className="btn solid hs-go-btn">
          {count === null ? "Search" : count === 0 ? "No matches" : `Show ${count} ${count === 1 ? "property" : "properties"}`}
        </button>
      </div>

      <p className="hs-live" aria-live="polite">
        {count === null ? "" : count === 0 ? "Nothing matches yet. Loosen a filter." : `${count} live ${count === 1 ? "listing matches" : "listings match"}, sorted from the most expensive.`}
      </p>
    </form>
  );
}
