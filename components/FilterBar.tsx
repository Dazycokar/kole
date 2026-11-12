import Link from "next/link";
import { AREAS, CITIES } from "@/lib/areas";
import type { Filters } from "@/lib/queries";

const PRICES: [string, string][] = [
  ["", "Any price"],
  ["20000000", "Up to ₦20M"],
  ["100000000", "Up to ₦100M"],
  ["250000000", "Up to ₦250M"],
  ["500000000", "Up to ₦500M"],
  ["1000000000", "Up to ₦1B"],
  ["2000000000", "Up to ₦2B"],
];

export default function FilterBar({ values, basePath = "/search", lockType }: { values: Filters; basePath?: string; lockType?: "house" | "land" }) {
  const typeLink = (t: string, label: string) => {
    const on = (values.type ?? "") === t;
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(values)) if (v && k !== "type") qs.set(k, v);
    if (t) qs.set("type", t);
    return (
      <Link key={label} href={`${basePath}?${qs.toString()}`} className="chip" aria-current={on ? "true" : undefined} data-on={on}>
        {label}
      </Link>
    );
  };

  return (
    <form className="fbar" action={basePath} method="get">
      {!lockType && (
        <div className="filters" role="group" aria-label="Type">
          {typeLink("", "All")}
          {typeLink("house", "Buildings")}
          {typeLink("land", "Land")}
        </div>
      )}
      {!lockType && values.type && <input type="hidden" name="type" value={values.type} />}

      <div className="fgrid">
        <label className="field">
          <span>Search</span>
          <input name="q" defaultValue={values.q ?? ""} placeholder="Ikoyi, duplex, pool…" />
        </label>
        <label className="field">
          <span>City</span>
          <select name="city" defaultValue={values.city ?? ""}>
            <option value="">Lagos and Abuja</option>
            {CITIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Area</span>
          <select name="area" defaultValue={values.area ?? ""}>
            <option value="">All areas</option>
            {CITIES.map((c) => (
              <optgroup key={c} label={c}>
                {AREAS[c].map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Buy or rent</span>
          <select name="purpose" defaultValue={values.purpose ?? ""}>
            <option value="">Buy or rent</option>
            <option value="sale">For sale</option>
            <option value="rent">For rent</option>
          </select>
        </label>
        {lockType !== "land" && (
        <label className="field">
          <span>Bedrooms</span>
          <select name="beds" defaultValue={values.beds ?? ""}>
            <option value="">Any</option>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n}+
              </option>
            ))}
          </select>
        </label>
        )}
        <label className="field">
          <span>Price</span>
          <select name="max" defaultValue={values.max ?? ""}>
            {PRICES.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Sort</span>
          <select name="sort" defaultValue={values.sort ?? ""}>
            <option value="">Newest first</option>
            <option value="priceAsc">Price, low to high</option>
            <option value="priceDesc">Price, high to low</option>
          </select>
        </label>
        <div className="fact">
          <button type="submit" className="btn solid">
            Search
          </button>
          <Link href={basePath} className="btn plain">
            Clear
          </Link>
        </div>
      </div>
    </form>
  );
}
