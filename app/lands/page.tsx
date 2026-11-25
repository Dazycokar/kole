import type { Metadata } from "next";
import { readFilters, type SP } from "@/lib/params";
import ListingsView from "@/components/ListingsView";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Lands" };

export default function Lands({ searchParams }: { searchParams: SP }) {
  return <ListingsView values={readFilters(searchParams)} basePath="/lands" lockType="land" title="Lands" intro="Plots with the title document named on the listing, so you know what you are asking about." />;
}
