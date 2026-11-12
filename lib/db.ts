import { newId } from "./ids";
import { promises as fs } from "fs";
import path from "path";
import { Pool, type PoolClient } from "pg";
import type { Db } from "./types";
import { buildSeed } from "./seed";
import { hashPassword, verifyPassword } from "./password";

/**
 * Storage for the whole site. Three modes, chosen automatically:
 *  - "postgres": DATABASE_URL (or POSTGRES_URL) is set. Use this on Vercel (Neon / Vercel Postgres / Supabase).
 *  - "file": a JSON file in ./data. Fine on your own computer or a host with a persistent disk.
 *  - "temp": running on Vercel without a database. The site still opens, but data lives in /tmp and is lost.
 * Everything else in the app only calls readDb, mutate and the upload helpers in lib/files.ts.
 */
const DB_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL || "";
const ON_VERCEL = !!process.env.VERCEL;

export type StorageMode = "postgres" | "file" | "temp";
export const storageMode: StorageMode = DB_URL ? "postgres" : ON_VERCEL ? "temp" : "file";

export const DATA_DIR = process.env.KOLE_DATA_DIR
  ? path.resolve(process.env.KOLE_DATA_DIR)
  : storageMode === "temp" ? "/tmp/kole-data" : path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "db.json");

type G = typeof globalThis & { __koleLock?: Promise<unknown>; __koleInit?: Promise<void>; __kolePool?: Pool };
const g = globalThis as G;

/* ---------- Postgres ---------- */

function pool(): Pool {
  if (!g.__kolePool) {
    const local = /@(localhost|127\.0\.0\.1)[:/]/.test(DB_URL) || /sslmode=disable/.test(DB_URL);
    // Neon and Vercel Postgres need SSL. Their certificates chain to public roots, so verification stays on.
    g.__kolePool = new Pool({
      connectionString: DB_URL.replace(/[?&]sslmode=[^&]*/, ""),
      ssl: local ? undefined : { rejectUnauthorized: true },
      max: Number(process.env.KOLE_PG_POOL) || 3,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 10_000,
    });
    g.__kolePool.on("error", () => {});
  }
  return g.__kolePool;
}

export function pgPool(): Pool {
  return pool();
}

async function pgSetup(c: PoolClient) {
  await c.query("CREATE TABLE IF NOT EXISTS kole_store (key text PRIMARY KEY, value jsonb NOT NULL)");
  await c.query("CREATE TABLE IF NOT EXISTS kole_files (id text PRIMARY KEY, mime text NOT NULL, data bytea NOT NULL, created_at timestamptz NOT NULL DEFAULT now())");
}

/* ---------- Shared ---------- */

/** Keeps the admin account in step with ADMIN_EMAIL and ADMIN_PASSWORD. */
async function syncAdmin(db: Db): Promise<boolean> {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) return false;
  let admin = db.users.find((u) => u.role === "admin");
  if (!admin) {
    admin = {
      id: newId(), name: "Site admin", email,
      passwordHash: await hashPassword(password), role: "admin", status: "active", createdAt: new Date().toISOString(),
    };
    db.users.push(admin);
    return true;
  }
  let changed = false;
  if (admin.email !== email && !db.users.some((u) => u.email === email && u.id !== admin!.id)) {
    admin.email = email;
    changed = true;
  }
  if (!(await verifyPassword(password, admin.passwordHash))) {
    admin.passwordHash = await hashPassword(password);
    changed = true;
  }
  if (admin.status !== "active") {
    admin.status = "active";
    changed = true;
  }
  return changed;
}

function normalise(db: Db): Db {
  db.saves ??= [];
  db.partnerRequests ??= [];
  db.teams ??= [];
  return db;
}

/* ---------- File mode ---------- */

async function writeFileDb(db: Db) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmp = `${FILE}.${process.pid}.${Date.now()}.tmp`;
  const text = JSON.stringify(db, null, 2);
  await fs.writeFile(tmp, text, "utf8");
  try {
    await fs.rename(tmp, FILE);
  } catch {
    await fs.writeFile(FILE, text, "utf8");
    await fs.unlink(tmp).catch(() => {});
  }
}

async function readFileDb(): Promise<Db> {
  for (let i = 0; ; i++) {
    try {
      return normalise(JSON.parse(await fs.readFile(FILE, "utf8")) as Db);
    } catch (e) {
      if (i >= 4) throw e;
      await new Promise((r) => setTimeout(r, 40 * (i + 1)));
    }
  }
}

/* ---------- Init ---------- */

async function ensureInit(): Promise<void> {
  if (!g.__koleInit) {
    g.__koleInit = (async () => {
      if (storageMode === "postgres") {
        const c = await pool().connect();
        try {
          await pgSetup(c);
          // Only one instance may seed. The advisory lock makes the others wait and then find the row.
          await c.query("SELECT pg_advisory_lock(727001)");
          try {
            const r = await c.query("SELECT value FROM kole_store WHERE key = 'db'");
            if (!r.rows.length) {
              const seed = await buildSeed();
              await syncAdmin(seed);
              await c.query("INSERT INTO kole_store (key, value) VALUES ('db', $1) ON CONFLICT (key) DO NOTHING", [JSON.stringify(seed)]);
            } else {
              const db = normalise(r.rows[0].value as Db);
              if (await syncAdmin(db)) await c.query("UPDATE kole_store SET value = $1 WHERE key = 'db'", [JSON.stringify(db)]);
            }
          } finally {
            await c.query("SELECT pg_advisory_unlock(727001)");
          }
        } finally {
          c.release();
        }
        return;
      }
      let db: Db;
      try {
        db = JSON.parse(await fs.readFile(FILE, "utf8")) as Db;
      } catch (e) {
        if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
        db = await buildSeed();
        await writeFileDb(db);
        return;
      }
      if (await syncAdmin(db)) await writeFileDb(db);
    })().catch((e) => {
      g.__koleInit = undefined;
      throw e;
    });
  }
  return g.__koleInit;
}

export async function readDb(): Promise<Db> {
  await ensureInit();
  if (storageMode === "postgres") {
    const r = await pool().query("SELECT value FROM kole_store WHERE key = 'db'");
    if (!r.rows.length) throw new Error("Database is empty.");
    return normalise(r.rows[0].value as Db);
  }
  return readFileDb();
}

/** Run a change against the database. Changes are applied one at a time and saved when the function returns. */
export async function mutate<T>(fn: (db: Db) => T | Promise<T>): Promise<T> {
  await ensureInit();
  if (storageMode === "postgres") {
    // A row lock makes this safe even when several serverless instances write at once.
    const c = await pool().connect();
    try {
      await c.query("BEGIN");
      const r = await c.query("SELECT value FROM kole_store WHERE key = 'db' FOR UPDATE");
      const db = normalise(r.rows[0].value as Db);
      const out = await fn(db);
      await c.query("UPDATE kole_store SET value = $1 WHERE key = 'db'", [JSON.stringify(db)]);
      await c.query("COMMIT");
      return out;
    } catch (e) {
      await c.query("ROLLBACK").catch(() => {});
      throw e;
    } finally {
      c.release();
    }
  }
  const prev = g.__koleLock ?? Promise.resolve();
  const run = prev
    .catch(() => {})
    .then(async () => {
      const db = await readFileDb();
      const out = await fn(db);
      await writeFileDb(db);
      return out;
    });
  g.__koleLock = run.catch(() => {});
  return run;
}
