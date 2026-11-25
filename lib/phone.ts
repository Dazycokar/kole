import { AsYouType, parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js/min";

/** Formats digits as the person types, in the style of the chosen country. */
export function formatAsYouType(national: string, iso: string): string {
  return new AsYouType(iso as CountryCode).input(national.replace(/[^\d]/g, ""));
}

export type PhoneResult = { ok: true; e164: string; pretty: string; iso?: string } | { ok: false; error: string };

/**
 * Turns what the person typed into one standard number (+2348012345678).
 * `raw` may start with + and a country code, or be a national number (a leading 0 is fine) for `iso`.
 */
export function normalisePhone(raw: string, iso?: string): PhoneResult {
  const text = raw.trim();
  if (!text) return { ok: false, error: "Enter your phone number." };
  const p = text.startsWith("+") ? parsePhoneNumberFromString(text) : parsePhoneNumberFromString(text, (iso || undefined) as CountryCode | undefined);
  if (!p || !p.isValid()) return { ok: false, error: "That phone number does not look right for the country you picked." };
  return { ok: true, e164: p.number, pretty: p.formatInternational(), iso: p.country };
}

/** Shows a stored number nicely; leaves old free-text numbers as they were. */
export function prettyPhone(stored?: string | null): string {
  if (!stored) return "";
  const p = stored.startsWith("+") ? parsePhoneNumberFromString(stored) : undefined;
  return p ? p.formatInternational() : stored;
}

/** Splits a stored number back into country and national digits so a form can be filled in. */
export function splitPhone(stored?: string | null): { iso?: string; national: string } {
  if (!stored) return { national: "" };
  const p = stored.startsWith("+") ? parsePhoneNumberFromString(stored) : undefined;
  if (!p) return { national: stored.replace(/[^\d]/g, "") };
  return { iso: p.country, national: p.nationalNumber };
}
