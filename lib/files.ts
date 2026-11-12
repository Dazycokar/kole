import path from "path";
import { promises as fs } from "fs";
import { DATA_DIR, pgPool, storageMode } from "./db";

/** Where uploaded photos live: a Postgres table when a database is set, otherwise the data folder. */
const MIME: Record<string, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" };

export async function saveFile(name: string, buf: Buffer): Promise<void> {
  const ext = name.split(".").pop() ?? "jpg";
  if (storageMode === "postgres") {
    await pgPool().query("INSERT INTO kole_files (id, mime, data) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING", [name, MIME[ext], buf]);
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
