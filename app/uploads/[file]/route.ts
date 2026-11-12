import { NextRequest } from "next/server";
import { loadFile } from "@/lib/files";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { file: string } }) {
  if (!/^[a-f0-9]{24}\.(jpg|png|webp)$/.test(params.file)) return new Response("Not found", { status: 404 });
  try {
    const f = await loadFile(params.file);
    if (!f) return new Response("Not found", { status: 404 });
    return new Response(new Uint8Array(f.data), {
      headers: { "Content-Type": f.mime, "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff" },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
