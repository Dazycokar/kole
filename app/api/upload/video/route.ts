import { NextRequest } from "next/server";
import crypto from "crypto";
import { Readable } from "stream";
import { getUser, isAdmin } from "@/lib/auth";
import { diskVideos, saveVideoStream } from "@/lib/files";
import { err, ok, limited, sameOrigin } from "@/lib/http";
import { MAX_VIDEO_MB, signUpload, supabaseStorageOn } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const TYPES: Record<string, string> = { "video/mp4": "mp4", "video/webm": "webm", "video/quicktime": "mov" };
const mode = () => (supabaseStorageOn ? "supabase" : diskVideos ? "server" : "none");

async function admin(req: NextRequest) {
  if (!sameOrigin(req)) return { e: err("Request blocked.", 403) };
  const u = await getUser();
  if (!u) return { e: err("Log in first.", 401) };
  if (!isAdmin(u)) return { e: err("Only the Kolé team can upload videos.", 403) };
  if (limited(`upv:${u.id}`, 30, 3600_000)) return { e: err("Too many uploads. Try again later.", 429) };
  return { u };
}

/** What the upload form should do on this server. */
export async function GET() {
  const u = await getUser();
  if (!u || !isAdmin(u)) return err("Admins only.", 403);
  return ok({ mode: mode(), maxMb: MAX_VIDEO_MB });
}

/**
 * JSON {type,size}: Supabase mode. Returns a one-time signed link so the browser sends the video straight to Supabase Storage.
 * multipart form with "file": server mode (own server with a disk), the file is written to the data folder.
 */
export async function POST(req: NextRequest) {
  const a = await admin(req);
  if (a.e) return a.e;
  const m = mode();
  if (m === "none") return err("Video upload needs Supabase Storage. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (see the README).", 501);
  const max = MAX_VIDEO_MB * 1024 * 1024;

  if ((req.headers.get("content-type") ?? "").includes("application/json")) {
    if (m !== "supabase") return err("Send the video as a file.", 400);
    const b = (await req.json().catch(() => null)) as { type?: string; size?: number } | null;
    const ext = TYPES[String(b?.type ?? "")];
    if (!ext) return err("Upload an MP4, WebM or MOV video.");
    if (!b?.size || b.size > max) return err(`That video is over ${MAX_VIDEO_MB} MB. Compress it (1080p MP4 is plenty) and try again.`);
    try {
      const s = await signUpload(`videos/${crypto.randomBytes(12).toString("hex")}.${ext}`);
      return ok({ mode: "supabase", uploadUrl: s.uploadUrl, url: s.publicUrl });
    } catch {
      return err("Could not reach Supabase Storage. Check SUPABASE_URL and the service role key.", 502);
    }
  }

  if (m !== "server") return err("Use the signed upload.", 400);
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return err("Could not read the upload.");
  }
  const f = form.get("file");
  if (!(f instanceof File)) return err("Choose a video to upload.");
  const ext = TYPES[f.type];
  if (!ext) return err("Upload an MP4, WebM or MOV video.");
  if (f.size > max) return err(`That video is over ${MAX_VIDEO_MB} MB.`);
  const head = Buffer.from(await f.slice(0, 12).arrayBuffer());
  const isWebm = head.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]));
  const isIso = head.subarray(4, 8).toString("ascii") === "ftyp";
  if (!(ext === "webm" ? isWebm : isIso)) return err("That file is not a real video.");
  const name = `${crypto.randomBytes(12).toString("hex")}.${ext}`;
  await saveVideoStream(name, Readable.fromWeb(f.stream() as never));
  return ok({ mode: "server", url: `/uploads/${name}` }, 201);
}
