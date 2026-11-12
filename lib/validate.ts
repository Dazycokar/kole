import { AREAS, CITIES, type City } from "./areas";
import { DOCS, STAGES, type Stage } from "./devtypes";
import type { PStatus, PropType, Purpose } from "./types";

export interface PropertyInput {
  title: string;
  type: PropType;
  subtype: string;
  purpose: Purpose;
  price: number;
  priceNote: string;
  city: City;
  area: string;
  address: string;
  beds?: number;
  baths?: number;
  parking?: number;
  sizeSqm?: number;
  plotSqm?: number;
  titleDoc: string;
  description: string;
  features: string[];
  photos: string[];
  panorama?: string;
  stage?: Stage;
  handover?: string;
  paymentPlan?: string;
  docs: string[];
  status: PStatus;
  published: boolean;
  featured?: boolean;
  developerId: string;
}

type Result = { ok: true; data: PropertyInput } | { ok: false; error: string };

const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

function optNum(v: unknown, min: number, max: number, label: string): { v?: number; error?: string } {
  if (v === undefined || v === null || v === "") return {};
  const n = typeof v === "number" ? v : Number(String(v).replace(/,/g, ""));
  if (!Number.isFinite(n) || n < min || n > max) return { error: `${label} is not a valid number.` };
  return { v: n };
}

const UPLOAD_URL = /^\/uploads\/[a-f0-9]{24}\.(jpg|png|webp)$/;
const REMOTE_URL = /^https:\/\/[^\s]{4,500}$/;

export function parseProperty(body: Record<string, unknown>): Result {
  const title = text(body.title, 120);
  if (title.length < 3) return { ok: false, error: "Add a title of at least 3 characters." };

  const type = body.type === "land" ? "land" : body.type === "house" ? "house" : null;
  if (!type) return { ok: false, error: "Choose whether this is a house or land." };

  const purpose: Purpose = type === "land" ? "sale" : body.purpose === "rent" ? "rent" : "sale";

  const price = optNum(body.price, 1, 1e13, "Price");
  if (price.error || price.v === undefined) return { ok: false, error: price.error ?? "Add a price." };

  const city = CITIES.find((c) => c === body.city);
  if (!city) return { ok: false, error: "Choose Lagos or Abuja." };
  const area = text(body.area, 60);
  if (!AREAS[city].includes(area)) return { ok: false, error: `Choose an area in ${city}.` };

  const beds = optNum(body.beds, 0, 50, "Bedrooms");
  const baths = optNum(body.baths, 0, 50, "Bathrooms");
  const parking = optNum(body.parking, 0, 100, "Parking spaces");
  const size = optNum(body.sizeSqm, 1, 1e7, "Building size");
  const plot = optNum(body.plotSqm, 1, 1e8, "Plot size");
  for (const x of [beds, baths, parking, size, plot]) if (x.error) return { ok: false, error: x.error };
  if (type === "land" && plot.v === undefined) return { ok: false, error: "Add the plot size in square metres." };

  const description = text(body.description, 4000);
  if (description.length < 10) return { ok: false, error: "Add a description of at least 10 characters." };

  const features = (Array.isArray(body.features) ? body.features : [])
    .map((f) => text(f, 60))
    .filter(Boolean)
    .slice(0, 20);

  const photos = (Array.isArray(body.photos) ? body.photos : []).filter((p): p is string => typeof p === "string").slice(0, 12);
  if (photos.length < 1) return { ok: false, error: "Add at least one photo." };
  if (!photos.every((p) => UPLOAD_URL.test(p) || REMOTE_URL.test(p))) return { ok: false, error: "One of the photos has an invalid link." };

  const pano = text(body.panorama, 600);
  if (pano && !(UPLOAD_URL.test(pano) || REMOTE_URL.test(pano))) return { ok: false, error: "The 360 photo has an invalid link." };

  const stage = type === "house" ? STAGES.find((s) => s.id === body.stage)?.id : undefined;
  const handoverRaw = text(body.handover, 7);
  if (handoverRaw && !/^\d{4}-(0[1-9]|1[0-2])$/.test(handoverRaw)) return { ok: false, error: "Handover date should be a month and year." };
  const docs = (Array.isArray(body.docs) ? body.docs : []).filter((d): d is string => typeof d === "string" && (DOCS as readonly string[]).includes(d));

  const developerId = text(body.developerId, 60);
  if (!developerId) return { ok: false, error: "Choose the developer this property belongs to." };

  const status: PStatus = body.status === "reserved" || body.status === "sold" ? body.status : "available";

  return {
    ok: true,
    data: {
      title, type, purpose, price: price.v, panorama: pano || undefined,
      stage, docs: Array.from(new Set(docs)),
      handover: type === "house" && stage && stage !== "ready" && handoverRaw ? handoverRaw : undefined,
      paymentPlan: text(body.paymentPlan, 500) || undefined, city, area, description, features, photos, status,
      subtype: text(body.subtype, 40),
      priceNote: text(body.priceNote, 30),
      address: text(body.address, 120),
      beds: type === "house" ? beds.v : undefined,
      baths: type === "house" ? baths.v : undefined,
      parking: type === "house" ? parking.v : undefined,
      sizeSqm: type === "house" ? size.v : undefined,
      plotSqm: plot.v,
      titleDoc: text(body.titleDoc, 60),
      published: body.published !== false,
      featured: typeof body.featured === "boolean" ? body.featured : undefined,
      developerId: text(body.developerId, 60),
    },
  };
}
