"use client";

import { useId } from "react";
import { countryByCode } from "@/lib/countries";
import { formatAsYouType, normalisePhone } from "@/lib/phone";
import CountrySelect from "./CountrySelect";

export interface PhoneValue { iso: string; national: string }

/** Phone number with a country-code selector. The number is formatted as you type and checked for the chosen country. */
export default function PhoneField({ value, onChange, label = "Phone number", optional, error, onBlur }: { value: PhoneValue; onChange: (v: PhoneValue) => void; label?: string; optional?: boolean; error?: string | null; onBlur?: () => void }) {
  const id = useId();
  const c = countryByCode(value.iso);
  return (
    <div className="field phone">
      <label htmlFor={id}><span>{label}{optional ? " (optional)" : ""}</span></label>
      <div className={`phone-row${error ? " invalid" : ""}`}>
        <CountrySelect variant="dial" label="Country code" value={value.iso} onChange={(x) => onChange({ iso: x.code, national: value.national })} invalid={!!error} />
        <input
          id={id}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          placeholder={c?.code === "NG" ? "801 234 5678" : "Phone number"}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-err` : undefined}
          value={formatAsYouType(value.national, value.iso)}
          onChange={(e) => onChange({ iso: value.iso, national: e.target.value.replace(/[^\d]/g, "") })}
          onBlur={onBlur}
        />
      </div>
      {error && <small id={`${id}-err`} className="field-err" role="alert">{error}</small>}
    </div>
  );
}

/** Joins the two parts into the one number that is sent to the server. */
export const phoneToE164 = (v: PhoneValue) => (v.national ? normalisePhone(v.national, v.iso) : normalisePhone(""));
