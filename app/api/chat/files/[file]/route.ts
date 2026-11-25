import { NextRequest } from "next/server";
import { readDb } from "@/lib/db";
import { loadFile } from "@/lib/files";
import { FILE_NAME, verifyUrl } from "@/lib/chatfiles";

export const dynamic = "force-dynamic";

/** Chat files open only through the short-lived signed link the conversation hands out. */
export async function GET(req: NextRequest, { params }: { params: { file: string } }) {
  const name = params.file;
  const u = new URL(req.url);
  if (!FILE_NAME.test(name)) return new Response("Not found", { status: 404 });
  const db = await readDb();
  if (!verifyUrl(db, name, u.searchParams.get("exp") ?? "", u.searchParams.get("sig") ?? "")) return new Response("This link has expired. Reopen the chat.", { status: 403 });
  const f = await loadFile(name);
  if (!f) return new Response("Not found", { status: 404 });
  const ext = name.split(".").pop()!;
  const inline = ["jpg", "png", "webp", "gif", "pdf"].includes(ext);
  const dl = (u.searchParams.get("name") ?? "").replace(/[^\w .()-]+/g, "_").slice(0, 80);
  return new Response(new Uint8Array(f.data), {
    headers: {
      "Content-Type": f.mime,
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${dl || name}"`,
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "sandbox; default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'",
      "Cache-Control": "private, max-age=600",
    },
  });
}
