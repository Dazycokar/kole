import path from "path";
import { promises as fs } from "fs";
import { DATA_DIR, pgPool, storageMode } from "./db";

/** Where uploaded photos live: a Postgres table when a database is set, otherwise the data folder. */
<<<<<<< HEAD
export const MIME: Record<string, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp", mp4: "video/mp4", webm: "video/webm", mov: "video/quicktime", gif: "image/gif", pdf: "application/pdf", txt: "text/plain", csv: "text/csv", doc: "application/msword", docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", xls: "application/vnd.ms-excel", xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", ppt: "application/vnd.ms-powerpoint", pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation" };
=======
export const MIME: Record<string, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp", mp4: "video/mp4", webm: "video/webm", mov: "video/quicktime" };
>>>>>>> e3c4a13a10f944d9e0c0142390b1a4c1606f8fcb

export async function saveFile(name: string, buf: Buffer): Promise<void> {
  const ext = name.split(".").pop() ?? "jpg";
  if (storageMode === "postgres") {
<<<<<<< HEAD
    await pgPool().query("INSERT INTO kole_files (id, mime, data) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING", [name, MIME[ext] ?? "application/octet-stream", buf]);
=======
    await pgPool().query("INSERT INTO kole_files (id, mime, data) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING", [name, MIME[ext], buf]);
>>>>>>> e3c4a13a10f944d9e0c0142390b1a4c1606f8fcb
    return;
  }
  const dir = path.join(DATA_DIR, "uploads");
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, name), buf);
}

export async function loadFile(name: string): Promise<{ data: Buffer; mime: string } | null> {
  const ext = name.split(".").pop() ?? "jpg";
  if (storageMode === "postgres") {
    const r = await pgPool().query("SELECT mime, data FROM kole_files WHERE id = $1", [name]);
    return r.rows.length ? { data: r.rows[0].data as Buffer, mime: r.rows[0].mime as string } : null;
  }
  try {
    return { data: await fs.readFile(path.join(DATA_DIR, "uploads", name)), mime: MIME[ext] };
  } catch {
    return null;
  }
}

/** Videos are only kept on disk (local or your own server). On Vercel they go to Supabase Storage instead. */
export const diskVideos = storageMode === "file";

export async function saveVideoStream(name: string, stream: import("stream").Readable): Promise<void> {
  const dir = path.join(DATA_DIR, "uploads");
  await fs.mkdir(dir, { recursive: true });
  const { pipeline } = await import("stream/promises");
  await pipeline(stream, (await import("fs")).createWriteStream(path.join(dir, name)));
}

export async function statVideo(name: string): Promise<{ size: number; mime: string } | null> {
  try {
    const st = await fs.stat(path.join(DATA_DIR, "uploads", name));
    return { size: st.size, mime: MIME[name.split(".").pop() ?? "mp4"] };
  } catch {
    return null;
  }
}

export async function openVideo(name: string, start: number, end: number) {
  const { createReadStream } = await import("fs");
  return createReadStream(path.join(DATA_DIR, "uploads", name), { start, end });
}
