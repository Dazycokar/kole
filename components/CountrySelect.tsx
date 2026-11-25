"use client";

import { Fragment, useEffect, useId, useMemo, useRef, useState } from "react";
import { COUNTRIES, POPULAR, type Country } from "@/lib/countries";

interface Props {
  value: string; // ISO code, or "" for none
  onChange: (c: Country) => void;
  /** "country" shows the name. "dial" shows the flag and calling code, for phone fields. */
  variant?: "country" | "dial";
  label: string;
  placeholder?: string;
  invalid?: boolean;
  id?: string;
}

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** A searchable country list with a flag, built as an accessible listbox: type to filter, arrows to move, Enter to pick, Esc to close. */
export default function CountrySelect({ value, onChange, variant = "country", label, placeholder = "Choose a country", invalid, id }: Props) {
  const uid = useId();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [hi, setHi] = useState(0);
  const wrap = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const cur = COUNTRIES.find((c) => c.code === value);

  const rows = useMemo(() => {
    const s = norm(q.trim());
    if (s) {
      const t = s.replace(/^\+/, "");
      const hit = (c: Country) => norm(c.name).includes(s) || c.code.toLowerCase() === s || c.dial.replace("+", "").startsWith(t);
      // Names that start with what was typed come first, so "ind" lists India before Indonesia, then Maldives.
      const rank = (c: Country) => (c.code.toLowerCase() === s ? 0 : norm(c.name).startsWith(s) ? 1 : 2);
      return COUNTRIES.filter(hit).sort((a, b) => rank(a) - rank(b)).map((c) => ({ c, group: "" }));
    }
    const pop = POPULAR.map((p) => COUNTRIES.find((c) => c.code === p)!).filter(Boolean);
    return [...pop.map((c) => ({ c, group: "Popular" })), ...COUNTRIES.map((c) => ({ c, group: "All countries" }))];
  }, [q]);

  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => { if (!wrap.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [open]);
  useEffect(() => { if (open) { setQ(""); setHi(Math.max(0, POPULAR.indexOf(value))); setTimeout(() => search.current?.focus(), 0); } }, [open, value]);
  useEffect(() => { setHi(0); }, [q]);
  useEffect(() => {
    if (!open || !rows[hi]) return;
    document.getElementById(`${uid}-${rows[hi].group}-${rows[hi].c.code}`)?.scrollIntoView?.({ block: "nearest" });
  }, [hi, rows, open, uid]);

  function pick(c: Country) {
    onChange(c);
    setOpen(false);
    btn.current?.focus();
  }

  return (
    <div className={`csel csel-${variant}`} ref={wrap}>
      <button
        ref={btn}
        id={id}
        type="button"
        className={`csel-btn${invalid ? " invalid" : ""}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={cur ? `${label}: ${cur.name} ${variant === "dial" ? cur.dial : ""}` : label}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => { if (e.key === "ArrowDown" && !open) { e.preventDefault(); setOpen(true); } }}
      >
        {cur ? (
          <>
            <span className="csel-flag" aria-hidden="true">{cur.flag}</span>
            {variant === "dial" ? <span className="csel-dial">{cur.dial}</span> : <span className="csel-name">{cur.name}</span>}
          </>
        ) : (
          <span className="csel-ph">{placeholder}</span>
        )}
        <svg className="csel-chev" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
      </button>
      {open && (
        <div className="csel-pop" role="dialog" aria-label={label}>
          <input
            ref={search}
            className="csel-search"
            type="search"
            inputMode="search"
            placeholder={variant === "dial" ? "Search country or code" : "Search countries"}
            aria-label="Search countries"
            role="combobox"
            aria-expanded="true"
            aria-controls={`${uid}-list`}
            aria-activedescendant={rows[hi] ? `${uid}-${rows[hi].group}-${rows[hi].c.code}` : undefined}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") { e.preventDefault(); setHi((h) => Math.min(rows.length - 1, h + 1)); }
              else if (e.key === "ArrowUp") { e.preventDefault(); setHi((h) => Math.max(0, h - 1)); }
              else if (e.key === "Enter") { e.preventDefault(); if (rows[hi]) pick(rows[hi].c); }
              else if (e.key === "Escape") { e.preventDefault(); setOpen(false); btn.current?.focus(); }
            }}
          />
          <ul ref={list} id={`${uid}-list`} role="listbox" aria-label={label} className="csel-list">
            {rows.length === 0 && <li className="csel-none" role="presentation">No country matches “{q}”.</li>}
            {rows.map(({ c, group }, i) => (
              <Fragment key={group + c.code}>
                {group && (i === 0 || rows[i - 1].group !== group) && <li role="presentation" className="csel-group">{group}</li>}
              <li
                id={`${uid}-${group}-${c.code}`}
                role="option"
                aria-selected={c.code === value}
                className={`csel-opt${i === hi ? " hi" : ""}${c.code === value ? " on" : ""}`}
                onPointerMove={() => setHi(i)}
                onClick={() => pick(c)}
              >
                <span className="csel-flag" aria-hidden="true">{c.flag}</span>
                <span className="csel-name">{c.name}</span>
                <span className="csel-code">{c.dial}</span>
              </li>
              </Fragment>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
