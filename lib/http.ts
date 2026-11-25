import { NextResponse } from "next/server";

export const err = (message: string, status = 400) => NextResponse.json({ error: message }, { status });
export const ok = (data: Record<string, unknown> = {}, status = 200) => NextResponse.json({ ok: true, ...data }, { status });

/** Blocks form posts that come from another website. */
export function sameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  try {
    const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function readJson(req: Request): Promise<Record<string, unknown> | null> {
  try {
    const body = await req.json();
    return body && typeof body === "object" && !Array.isArray(body) ? (body as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export function clientIp(req: Request): string {
  return (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "local";
}

export function isHttps(req: Request): boolean {
  return req.headers.get("x-forwarded-proto") === "https" || new URL(req.url).protocol === "https:";
}

type G = typeof globalThis & { __koleHits?: Map<string, number[]> };
/** Returns true when the caller has made too many requests with this key in the window. */
export function limited(key: string, max: number, windowMs: number): boolean {
  const g = globalThis as G;
  const hits: Map<string, number[]> = (g.__koleHits ??= new Map<string, number[]>());
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) for (const [k, v] of hits) if (!v.some((t) => now - t < windowMs)) hits.delete(k);
  return recent.length > max;
}

export const str = (v: unknown, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : "");
