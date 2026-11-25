import { NextRequest } from "next/server";
import crypto from "crypto";
import { readDb } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { saveFile } from "@/lib/files";
import { CHAT_MIME, MAX_CHAT_BYTES, cleanName, sniffChat, uploadSig } from "@/lib/chatfiles";
import { err, ok, limited, sameOrigin } from "@/lib/http";
import type { Attachment } from "@/lib/types";

export const dynamic = "force-dynamic";

/** Step one of sharing a file: store it and hand back a receipt the message can carry. Clients and the team can both use it. */
export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return err("Request blocked.", 403);
  const user = await getUser();
  if (!user) return err("Log in first.", 401);
  if (user.role === "developer") return err("Developer accounts cannot use chat.", 403);
  if (limited(`cup:${user.id}`, 40, 3600_000)) return err("Too many files. Try again in a while.", 429);

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return err("Could not read the upload.");
  }
  const file = form.get("file");
  if (!(file instanceof File)) return err("Choose a file to send.");
  if (file.size > MAX_CHAT_BYTES) return err(`That file is over ${MAX_CHAT_BYTES / 1048576} MB.`);
  const buf = Buffer.from(await file.arrayBuffer());
  const ext = sniffChat(buf, file.name);
  if (!ext) return err("That file type is not allowed. Send photos, PDF, Word, Excel, PowerPoint, TXT or CSV.");

  const stored = `c${crypto.randomBytes(12).toString("hex")}.${ext}`;
  try {
    await saveFile(stored, buf);
  } catch {
    return err("Could not store that file. Try again.", 500);
  }
  const a: Attachment = { file: stored, name: cleanName(file.name), mime: CHAT_MIME[ext], size: buf.length };
  const db = await readDb();
  return ok({ attachment: { ...a, sig: uploadSig(db, user.id, a) } }, 201);
}
