import type { Metadata } from "next";
import { readFilters, type SP } from "@/lib/params";
import ListingsView from "@/components/ListingsView";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Buildings" };

export default function Buildings({ searchParams }: { searchParams: SP }) {
  return <ListingsView values={readFilters(searchParams)} basePath="/buildings" lockType="house" title="Buildings" intro="Houses, duplexes, apartments and penthouses from developers in Lagos and Abuja." />;
}
