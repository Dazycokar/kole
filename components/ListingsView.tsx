import { getUser } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { filterProperties, publishedOnly, type Filters } from "@/lib/queries";
import { savedIds } from "@/lib/lists";
import FilterBar from "./FilterBar";
import PropertyCard from "./PropertyCard";
import Reveal from "./Reveal";

/** The searchable grid used by /search, /buildings and /lands. */
export default async function ListingsView({
  values, basePath, lockType, title, intro,
}: { values: Filters; basePath: string; lockType?: "house" | "land"; title: string; intro: string }) {
  const [db, user] = await Promise.all([readDb(), getUser()]);
  const saved = savedIds(db, user);
  const v: Filters = lockType ? { ...values, type: lockType } : values;
  const list = filterProperties(publishedOnly(db), v);

  return (
    <main className="page" id="top">
      <div className="wrap">
        <div className="sec-head">
          <h2>{title}</h2>
          <p>
            {intro} <b>{list.length}</b> {list.length === 1 ? "match" : "matches"}
            {v.city ? ` in ${v.city}` : ""}.
          </p>
        </div>
        <FilterBar values={v} basePath={basePath} lockType={lockType} />
        <div className="grid">
          {list.length === 0 && <div className="empty">Nothing matches those filters yet. Try a different area or clear the filters.</div>}
          {list.map((p, i) => (
            <Reveal key={p.id} delay={(i % 3) * 90} className="cell">
              <PropertyCard p={p} saved={saved.has(p.id)} />
            </Reveal>
          ))}
        </div>
      </div>
    </main>
  );
}
