import crypto from "crypto";
import { promisify } from "util";

const scrypt = promisify(crypto.scrypt) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>;

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16);
  const key = await scrypt(password, salt, 64);
  return `s1$${salt.toString("hex")}$${key.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [version, salt, hash] = stored.split("$");
  if (version !== "s1" || !salt || !hash) return false;
  const key = await scrypt(password, Buffer.from(salt, "hex"), 64);
  const expected = Buffer.from(hash, "hex");
  return expected.length === key.length && crypto.timingSafeEqual(expected, key);
}
