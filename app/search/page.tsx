import type { Metadata } from "next";
import { readFilters, type SP } from "@/lib/params";
import ListingsView from "@/components/ListingsView";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Search" };

export default function Search({ searchParams }: { searchParams: SP }) {
  return <ListingsView values={readFilters(searchParams)} basePath="/search" title="Search every listing" intro="Buildings and land across Lagos and Abuja." />;
}
