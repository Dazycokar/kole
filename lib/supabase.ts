/**
 * Supabase Storage, called over its REST API (no extra package needed).
 * Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY. Files go in one public bucket (SUPABASE_BUCKET, default "kole-media").
 * The service-role key stays on the server. Browsers only ever get a one-time signed upload link.
 */
const URL_ = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/+$/, "");
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
export const BUCKET = process.env.SUPABASE_BUCKET || "kole-media";

export const supabaseStorageOn = !!(URL_ && KEY);
/** Biggest video the site accepts, in MB. Supabase's free plan caps one file at 50 MB; raise it on a paid plan. */
export const MAX_VIDEO_MB = Number(process.env.KOLE_MAX_VIDEO_MB) || 50;

const auth = () => ({ Authorization: `Bearer ${KEY}`, apikey: KEY });
export const publicUrl = (key: string) => `${URL_}/storage/v1/object/public/${BUCKET}/${key}`;

/** True for links that point into our own bucket. */
export function isOurMedia(u: string): boolean {
  return !!URL_ && u.startsWith(`${URL_}/storage/v1/object/public/${BUCKET}/`);
}

let ensured: Promise<void> | null = null;
/** Creates the public bucket the first time. Safe to call again. */
export function ensureBucket(): Promise<void> {
  if (!ensured) {
    ensured = (async () => {
      const r = await fetch(`${URL_}/storage/v1/bucket`, {
        method: "POST",
        headers: { ...auth(), "content-type": "application/json" },
        body: JSON.stringify({ id: BUCKET, name: BUCKET, public: true, file_size_limit: MAX_VIDEO_MB * 1024 * 1024 }),
      });
      if (!r.ok && r.status !== 409) {
        const t = await r.text();
        if (!/already exists|Duplicate/i.test(t)) throw new Error(`Supabase bucket: ${r.status} ${t.slice(0, 160)}`);
      }
    })().catch((e) => {
      ensured = null;
      throw e;
    });
  }
  return ensured;
}

/** Upload a small file (photos) from the server. Returns the public link. */
export async function putObject(key: string, data: Buffer, mime: string): Promise<string> {
  await ensureBucket();
  const r = await fetch(`${URL_}/storage/v1/object/${BUCKET}/${key}`, {
    method: "POST",
    headers: { ...auth(), "content-type": mime, "x-upsert": "false", "cache-control": "max-age=31536000" },
    body: new Uint8Array(data),
  });
  if (!r.ok) throw new Error(`Supabase upload: ${r.status} ${(await r.text()).slice(0, 160)}`);
  return publicUrl(key);
}

/** A one-time link the browser can PUT a big file to (videos), so the file never passes through Vercel. */
export async function signUpload(key: string): Promise<{ uploadUrl: string; token: string; publicUrl: string }> {
  await ensureBucket();
  const r = await fetch(`${URL_}/storage/v1/object/upload/sign/${BUCKET}/${key}`, { method: "POST", headers: auth() });
  if (!r.ok) throw new Error(`Supabase sign: ${r.status} ${(await r.text()).slice(0, 160)}`);
  const j = (await r.json()) as { url: string };
  const full = j.url.startsWith("http") ? j.url : `${URL_}/storage/v1${j.url.startsWith("/") ? "" : "/"}${j.url}`;
  const token = new URL(full).searchParams.get("token") ?? "";
  return { uploadUrl: full, token, publicUrl: publicUrl(key) };
}
