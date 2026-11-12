import { redirect } from "next/navigation";
import type { SP } from "@/lib/params";

export const dynamic = "force-dynamic";

/** Old address. Every filter in the link is carried over to /search. */
export default function Properties({ searchParams }: { searchParams: SP }) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(searchParams)) {
    const val = Array.isArray(v) ? v[0] : v;
    if (val) qs.set(k, val);
  }
  const type = qs.get("type");
  if (type === "house") { qs.delete("type"); redirect(`/buildings${[...qs].length ? `?${qs}` : ""}`); }
  if (type === "land") { qs.delete("type"); redirect(`/lands${[...qs].length ? `?${qs}` : ""}`); }
  redirect(`/search${[...qs].length ? `?${qs}` : ""}`);
}
