import { countryByCode } from "./countries";
import { str } from "./http";
import { normalisePhone } from "./phone";

export type Location = { ok: true; country?: string; countryCode?: string; phone?: string } | { ok: false; error: string };

/**
 * Reads the location and phone from a sign-up or profile form.
 * The country comes from the picker (countryCode); old clients may still send free text.
 * The phone is stored as one standard number such as +2348012345678.
 */
export function readLocation(b: Record<string, unknown>, opts: { countryRequired?: boolean } = {}): Location {
  const picked = countryByCode(str(b.countryCode, 2));
  const country = picked?.name ?? str(b.country, 60);
  if (opts.countryRequired && !country) return { ok: false, error: "Choose the country you live in." };
  const raw = str(b.phone, 40);
  let phone: string | undefined;
  if (raw) {
    const r = normalisePhone(raw, str(b.phoneCountry, 2) || picked?.code);
    if (!r.ok) return { ok: false, error: r.error };
    phone = r.e164;
  }
  return { ok: true, country: country || undefined, countryCode: picked?.code, phone };
}
