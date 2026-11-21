import { isDevType, type DevType } from "./devtypes";

export interface DeveloperInput {
  company: string;
  devType: DevType;
  about?: string;
  rcNumber?: string;
  contactName?: string;
  phone?: string;
  contactEmail?: string;
  verified?: boolean;
}

const t = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function parseDeveloper(b: Record<string, unknown>): { ok: true; data: DeveloperInput } | { ok: false; error: string } {
  const company = t(b.company, 80);
  if (company.length < 2) return { ok: false, error: "Enter the developer's company name." };
  if (!isDevType(b.devType)) return { ok: false, error: "Choose the kind of developer." };
  const rcNumber = t(b.rcNumber, 20);
  if (rcNumber && !/^[A-Za-z0-9 \-\/]{3,20}$/.test(rcNumber)) return { ok: false, error: "The CAC number should be letters and numbers only." };
  const contactEmail = t(b.contactEmail, 120).toLowerCase();
  if (contactEmail && !EMAIL.test(contactEmail)) return { ok: false, error: "Enter a valid contact email or leave it empty." };
  return {
    ok: true,
    data: {
      company, devType: b.devType,
      about: t(b.about, 600) || undefined,
      rcNumber: rcNumber || undefined,
      contactName: t(b.contactName, 80) || undefined,
      phone: t(b.phone, 30) || undefined,
      contactEmail: contactEmail || undefined,
      verified: typeof b.verified === "boolean" ? b.verified : undefined,
    },
  };
}
