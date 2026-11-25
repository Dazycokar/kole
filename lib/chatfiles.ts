import crypto from "crypto";
import type { Attachment, ChatAttachment, Db } from "./types";

export const ON_VERCEL = !!process.env.VERCEL;
export const MAX_CHAT_BYTES = ON_VERCEL ? 4 * 1024 * 1024 : 12 * 1024 * 1024;
export const MAX_ATTACH = 5;

const TYPES: Record<string, string> = {
  jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif",
  pdf: "application/pdf", txt: "text/plain", csv: "text/csv",
  doc: "application/msword", docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel", xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ppt: "application/vnd.ms-powerpoint", pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
};
export const CHAT_MIME = TYPES;
export const FILE_NAME = /^c[a-f0-9]{24}\.(jpg|png|webp|gif|pdf|txt|csv|doc|docx|xls|xlsx|ppt|pptx)$/;

/** Decide the file type from its first bytes plus its extension. Returns the stored extension, or null if it is not allowed. */
export function sniffChat(buf: Buffer, originalName: string): string | null {
  const ext = (originalName.split(".").pop() ?? "").toLowerCase();
  const h = buf.subarray(0, 8);
  if (buf.length < 4) return null;
  if (h[0] === 0xff && h[1] === 0xd8 && h[2] === 0xff) return "jpg";
  if (h.equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
  if (buf.subarray(0, 4).toString("ascii") === "RIFF" && buf.subarray(8, 12).toString("ascii") === "WEBP") return "webp";
  if (buf.subarray(0, 4).toString("ascii") === "GIF8") return "gif";
  if (buf.subarray(0, 5).toString("ascii") === "%PDF-") return "pdf";
  if (h[0] === 0x50 && h[1] === 0x4b && h[2] === 0x03 && h[3] === 0x04) return ["docx", "xlsx", "pptx"].includes(ext) ? ext : null;
  if (h.equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]))) return ["doc", "xls", "ppt"].includes(ext) ? ext : null;
  if (["txt", "csv"].includes(ext) && !buf.subarray(0, 4096).includes(0)) return ext;
  return null;
}

export const cleanName = (n: string) =>
  n.replace(/[\u0000-\u001f\u007f<>:"/\\|?*]+/g, "").replace(/^\.+/, "").trim().slice(-80) || "file";

const mac = (db: Db, payload: string) => crypto.createHmac("sha256", db.meta.secret).update(payload).digest("base64url");

/** Proof that this person uploaded this file, so a message cannot point at somebody else's. */
export const uploadSig = (db: Db, userId: string, a: Attachment) => mac(db, `up|${userId}|${a.file}|${a.name}|${a.mime}|${a.size}`);

export function checkAttachments(db: Db, userId: string, raw: unknown): Attachment[] | null {
  if (raw === undefined || raw === null) return [];
  if (!Array.isArray(raw) || raw.length > MAX_ATTACH) return null;
  const out: Attachment[] = [];
  for (const r of raw) {
    if (!r || typeof r !== "object") return null;
    const o = r as Record<string, unknown>;
    const a: Attachment = { file: String(o.file ?? ""), name: String(o.name ?? ""), mime: String(o.mime ?? ""), size: Number(o.size) };
    if (!FILE_NAME.test(a.file) || a.name.length > 120) return null;
    if (uploadSig(db, userId, a) !== o.sig) return null;
    out.push(a);
  }
  return out;
}

export function signedUrl(db: Db, file: string, ttlMs = 3600_000): string {
  const exp = Date.now() + ttlMs;
  return `/api/chat/files/${file}?exp=${exp}&sig=${mac(db, `dl|${file}|${exp}`)}`;
}
export function verifyUrl(db: Db, file: string, exp: string, sig: string): boolean {
  if (!/^\d{10,15}$/.test(exp) || Number(exp) < Date.now()) return false;
  const want = mac(db, `dl|${file}|${exp}`);
  return want.length === sig.length && crypto.timingSafeEqual(Buffer.from(want), Buffer.from(sig));
}

export const toChatAttachment = (db: Db, a: Attachment): ChatAttachment => ({ ...a, url: signedUrl(db, a.file), image: a.mime.startsWith("image/") });
