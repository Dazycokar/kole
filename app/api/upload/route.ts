import { NextRequest } from "next/server";
import crypto from "crypto";
import { getUser, isAdmin } from "@/lib/auth";
import { saveFile } from "@/lib/files";
import { err, ok, limited, sameOrigin } from "@/lib/http";

export const dynamic = "force-dynamic";

// Vercel rejects request bodies over 4.5 MB, so the form shrinks photos in the browser first and the limits sit just under that.
const ON_VERCEL = !!process.env.VERCEL;
const MAX_BYTES = ON_VERCEL ? 4 * 1024 * 1024 : 6 * 1024 * 1024;
const MAX_PANO_BYTES = ON_VERCEL ? 4 * 1024 * 1024 : 14 * 1024 * 1024;

/** Work out the real image type from the first bytes, not from the file name the browser sent. */
function sniff(buf: Buffer): "jpg" | "png" | "webp" | null {
  if (buf.length > 12 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpg";
  if (buf.length > 12 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
  if (buf.length > 12 && buf.subarray(0, 4).toString("ascii") === "RIFF" && buf.subarray(8, 12).toString("ascii") === "WEBP") return "webp";
  return null;
}

export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return err("Request blocked.", 403);
  const user = await getUser();
  if (!user) return err("Log in first.", 401);
  if (!isAdmin(user)) return err("Only the Kolé team can upload photos.", 403);
  if (limited(`up:${user.id}`, 60, 3600_000)) return err("Too many uploads. Try again later.", 429);

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return err("Could not read the upload.");
  }
  const file = form.get("file");
  if (!(file instanceof File)) return err("Choose a photo to upload.");
  const pano = form.get("kind") === "pano";
  if (file.size > (pano ? MAX_PANO_BYTES : MAX_BYTES)) return err(pano ? `That 360 photo is over ${MAX_PANO_BYTES / 1048576} MB.` : `That photo is over ${MAX_BYTES / 1048576} MB. Choose a smaller one.`);

  const buf = Buffer.from(await file.arrayBuffer());
  const ext = sniff(buf);
  if (!ext) return err("Upload a JPG, PNG or WebP photo.");

  const name = `${crypto.randomBytes(12).toString("hex")}.${ext}`;
  try {
    await saveFile(name, buf);
  } catch {
    return err("Could not store that photo. Check the database connection.", 500);
  }
  return ok({ url: `/uploads/${name}` }, 201);
}
