import { NextRequest } from "next/server";
import { Readable } from "stream";
import { loadFile, openVideo, statVideo } from "@/lib/files";

export const dynamic = "force-dynamic";

const HEAD = { "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff", "Accept-Ranges": "bytes" };

export async function GET(req: NextRequest, { params }: { params: { file: string } }) {
  const name = params.file;
  if (/^[a-f0-9]{24}\.(mp4|webm|mov)$/.test(name)) {
    // Videos stream from disk with Range support so seeking works on phones.
    const st = await statVideo(name);
    if (!st) return new Response("Not found", { status: 404 });
    const m = /^bytes=(\d*)-(\d*)$/.exec(req.headers.get("range") ?? "");
    let start = 0, end = st.size - 1, status = 200;
    if (m && (m[1] || m[2])) {
      if (m[1]) { start = Number(m[1]); end = m[2] ? Math.min(Number(m[2]), st.size - 1) : st.size - 1; }
      else { start = Math.max(0, st.size - Number(m[2])); }
      if (start > end || start >= st.size) return new Response("Bad range", { status: 416, headers: { "Content-Range": `bytes */${st.size}` } });
      status = 206;
    }
    const body = Readable.toWeb(await openVideo(name, start, end)) as unknown as ReadableStream;
    return new Response(body, {
      status,
      headers: { ...HEAD, "Content-Type": st.mime, "Content-Length": String(end - start + 1), ...(status === 206 ? { "Content-Range": `bytes ${start}-${end}/${st.size}` } : {}) },
    });
  }
  if (!/^[a-f0-9]{24}\.(jpg|png|webp)$/.test(name)) return new Response("Not found", { status: 404 });
  try {
    const f = await loadFile(name);
    if (!f) return new Response("Not found", { status: 404 });
    return new Response(new Uint8Array(f.data), { headers: { ...HEAD, "Content-Type": f.mime } });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
