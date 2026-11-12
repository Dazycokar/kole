"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { AREAS, CITIES, HOUSE_SUBTYPES, LAND_SUBTYPES, TITLE_DOCS, type City } from "@/lib/areas";
import { naira } from "@/lib/format";
import { DOCS, STAGES, type Stage } from "@/lib/devtypes";
import type { Property } from "@/lib/types";
import Photo from "./Photo";

interface Props {
  initial?: Property;
  isAdmin: boolean;
  developers: { id: string; name: string }[];
}

const digits = (v: string) => v.replace(/[^\d]/g, "");
const withCommas = (v: string) => (v ? Number(v).toLocaleString("en-US") : "");

/** Shrinks a photo in the browser so it stays under the 4.5 MB request limit on Vercel. Small files pass through untouched. */
async function shrink(file: File, maxDim: number, limit = 3.5 * 1024 * 1024): Promise<File> {
  if (file.size <= limit && file.type !== "image/png") return file;
  if (file.size <= 1.5 * 1024 * 1024) return file;
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, maxDim / Math.max(bmp.width, bmp.height));
    const c = document.createElement("canvas");
    c.width = Math.round(bmp.width * scale);
    c.height = Math.round(bmp.height * scale);
    c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
    for (const q of [0.88, 0.8, 0.7, 0.6]) {
      const blob = await new Promise<Blob | null>((r) => c.toBlob(r, "image/jpeg", q));
      if (blob && blob.size <= limit) return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
    }
  } catch {
    /* fall through and let the server decide */
  }
  return file;
}

export default function PropertyForm({ initial, isAdmin, developers }: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const editing = !!initial;

  const [type, setType] = useState<"house" | "land">(initial?.type ?? "house");
  const [purpose, setPurpose] = useState<"sale" | "rent">(initial?.purpose ?? "sale");
  const [city, setCity] = useState<City>((initial?.city as City) ?? "Lagos");
  const [area, setArea] = useState(initial?.area ?? AREAS.Lagos[0]);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [subtype, setSubtype] = useState(initial?.subtype ?? HOUSE_SUBTYPES[0]);
  const [price, setPrice] = useState(initial ? String(initial.price) : "");
  const [priceNote, setPriceNote] = useState(initial?.priceNote ?? "");
  const [address, setAddress] = useState(initial?.address ?? "");
  const [beds, setBeds] = useState(initial?.beds !== undefined ? String(initial.beds) : "");
  const [baths, setBaths] = useState(initial?.baths !== undefined ? String(initial.baths) : "");
  const [parking, setParking] = useState(initial?.parking !== undefined ? String(initial.parking) : "");
  const [sizeSqm, setSizeSqm] = useState(initial?.sizeSqm !== undefined ? String(initial.sizeSqm) : "");
  const [plotSqm, setPlotSqm] = useState(initial?.plotSqm !== undefined ? String(initial.plotSqm) : "");
  const [titleDoc, setTitleDoc] = useState(initial?.titleDoc ?? "");
  const [stage, setStage] = useState<Stage>(initial?.stage ?? "ready");
  const [handover, setHandover] = useState(initial?.handover ?? "");
  const [paymentPlan, setPaymentPlan] = useState(initial?.paymentPlan ?? "");
  const [docs, setDocs] = useState<string[]>(initial?.docs ?? []);
  const [description, setDescription] = useState(initial?.description ?? "");
  const [features, setFeatures] = useState((initial?.features ?? []).join("\n"));
  const [photos, setPhotos] = useState<string[]>(initial?.photos ?? []);
  const [panorama, setPanorama] = useState(initial?.panorama ?? "");
  const [panoBusy, setPanoBusy] = useState(false);
  const [status, setStatus] = useState(initial?.status ?? "available");
  const [published, setPublished] = useState(initial?.published ?? true);
  const [featured, setFeatured] = useState(initial?.featured ?? false);
  const [developerId, setDeveloperId] = useState(initial?.developerId ?? developers[0]?.id ?? "");
  const [urlInput, setUrlInput] = useState("");

  const [uploading, setUploading] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function changeType(t: "house" | "land") {
    setType(t);
    setSubtype(t === "land" ? LAND_SUBTYPES[0] : HOUSE_SUBTYPES[0]);
    if (t === "land") setPurpose("sale");
  }

  function changeCity(c: City) {
    setCity(c);
    setArea(AREAS[c][0]);
  }

  async function uploadFiles(files: FileList | null) {
    if (!files || !files.length) return;
    setPhotoError(null);
    const list = Array.from(files).slice(0, 12 - photos.length);
    const added: string[] = [];
    for (let i = 0; i < list.length; i++) {
      setUploading(`Uploading ${i + 1} of ${list.length}…`);
      const fd = new FormData();
      fd.append("file", await shrink(list[i], 2400));
      try {
        const r = await fetch("/api/upload", { method: "POST", body: fd });
        const j = await r.json().catch(() => ({}));
        if (!r.ok) {
          setPhotoError(`${list[i].name}: ${j.error || "upload failed"}`);
          break;
        }
        added.push(j.url);
      } catch {
        setPhotoError(`${list[i].name}: could not reach the server.`);
        break;
      }
    }
    setPhotos((p) => [...p, ...added]);
    setUploading(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function uploadPano(files: FileList | null) {
    const f = files?.[0];
    if (!f) return;
    setPhotoError(null);
    setPanoBusy(true);
    const fd = new FormData();
    fd.append("file", await shrink(f, 4096));
    fd.append("kind", "pano");
    try {
      const r = await fetch("/api/upload", { method: "POST", body: fd });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) setPhotoError(`${f.name}: ${j.error || "upload failed"}`);
      else setPanorama(j.url);
    } catch {
      setPhotoError(`${f.name}: could not reach the server.`);
    }
    setPanoBusy(false);
  }

  function addUrl() {
    const u = urlInput.trim();
    if (!/^https:\/\/\S{4,}$/.test(u)) {
      setPhotoError("Paste a full image link that starts with https://");
      return;
    }
    if (photos.length >= 12) {
      setPhotoError("You can add up to 12 photos.");
      return;
    }
    setPhotoError(null);
    setPhotos((p) => [...p, u]);
    setUrlInput("");
  }

  const makeCover = (i: number) => setPhotos((p) => [p[i], ...p.filter((_, n) => n !== i)]);
  const removePhoto = (i: number) => setPhotos((p) => p.filter((_, n) => n !== i));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const body = {
      title, type, subtype, purpose, price: Number(price || 0), priceNote, city, area, address,
      beds, baths, parking, sizeSqm, plotSqm, titleDoc, description,
      features: features.split("\n").map((s) => s.trim()).filter(Boolean),
      photos, panorama, status, published, developerId,
      stage: type === "house" ? stage : undefined, handover: type === "house" && stage !== "ready" ? handover : "", paymentPlan, docs,
      ...(isAdmin ? { featured } : {}),
    };
    try {
      const r = await fetch(editing ? `/api/admin/properties/${initial!.id}` : "/api/admin/properties", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        setError(j.error || "Could not save. Check the form and try again.");
        setSaving(false);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      router.push("/admin");
      router.refresh();
    } catch {
      setError("Could not reach the server. Check your connection.");
      setSaving(false);
    }
  }

  return (
    <form className="pform" onSubmit={save} noValidate>
      {error && (
        <p className="form-error big" role="alert">
          {error}
        </p>
      )}

      <fieldset>
        <legend>What are you listing?</legend>
        <div className="seg" role="radiogroup" aria-label="Property type">
          <button type="button" role="radio" aria-checked={type === "house"} onClick={() => changeType("house")}>
            House or apartment
          </button>
          <button type="button" role="radio" aria-checked={type === "land"} onClick={() => changeType("land")}>
            Land
          </button>
        </div>
        <div className="fgrid two">
          <label className="field wide2">
            <span>Title</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. 5-bedroom detached duplex with pool" maxLength={120} />
          </label>
          <label className="field">
            <span>{type === "land" ? "Kind of plot" : "Kind of home"}</span>
            <select value={subtype} onChange={(e) => setSubtype(e.target.value)}>
              {(type === "land" ? LAND_SUBTYPES : HOUSE_SUBTYPES).map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          {type === "house" && (
            <label className="field">
              <span>Sale or rent</span>
              <select value={purpose} onChange={(e) => setPurpose(e.target.value as "sale" | "rent")}>
                <option value="sale">For sale</option>
                <option value="rent">For rent</option>
              </select>
            </label>
          )}
        </div>
      </fieldset>

      <fieldset>
        <legend>Price and location</legend>
        <div className="fgrid two">
          <label className="field">
            <span>Price (₦)</span>
            <input inputMode="numeric" value={withCommas(price)} onChange={(e) => setPrice(digits(e.target.value))} placeholder="850,000,000" />
            {price && <small>{naira(Number(price))}</small>}
          </label>
          <label className="field">
            <span>Price note (optional)</span>
            <input value={priceNote} onChange={(e) => setPriceNote(e.target.value)} placeholder={purpose === "rent" ? "per year" : "negotiable"} maxLength={30} />
          </label>
          <label className="field">
            <span>City</span>
            <select value={city} onChange={(e) => changeCity(e.target.value as City)}>
              {CITIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Area</span>
            <select value={area} onChange={(e) => setArea(e.target.value)}>
              {AREAS[city].map((a) => (
                <option key={a}>{a}</option>
              ))}
            </select>
          </label>
          <label className="field wide2">
            <span>Street or landmark (optional)</span>
            <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Old Ikoyi, near the club" maxLength={120} />
          </label>
        </div>
      </fieldset>

      <fieldset>
        <legend>{type === "land" ? "Plot details" : "Home details"}</legend>
        <div className="fgrid four">
          {type === "house" ? (
            <>
              <label className="field">
                <span>Bedrooms</span>
                <input inputMode="numeric" value={beds} onChange={(e) => setBeds(digits(e.target.value))} />
              </label>
              <label className="field">
                <span>Bathrooms</span>
                <input inputMode="numeric" value={baths} onChange={(e) => setBaths(digits(e.target.value))} />
              </label>
              <label className="field">
                <span>Parking spaces</span>
                <input inputMode="numeric" value={parking} onChange={(e) => setParking(digits(e.target.value))} />
              </label>
              <label className="field">
                <span>Building size (sqm)</span>
                <input inputMode="numeric" value={sizeSqm} onChange={(e) => setSizeSqm(digits(e.target.value))} />
              </label>
            </>
          ) : (
            <label className="field wide2">
              <span>Title document</span>
              <select value={titleDoc} onChange={(e) => setTitleDoc(e.target.value)}>
                <option value="">Choose one</option>
                {TITLE_DOCS.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </label>
          )}
          <label className="field">
            <span>Plot size (sqm){type === "land" ? "" : " (optional)"}</span>
            <input inputMode="numeric" value={plotSqm} onChange={(e) => setPlotSqm(digits(e.target.value))} />
          </label>
        </div>
        <label className="field">
          <span>Description</span>
          <textarea rows={6} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={4000} placeholder="What makes this property worth a visit? Finishes, power, security, the estate, what is nearby." />
        </label>
        <label className="field">
          <span>Features (one per line)</span>
          <textarea rows={4} value={features} onChange={(e) => setFeatures(e.target.value)} placeholder={"Swimming pool\nBoys' quarters\n24-hour power backup"} />
        </label>
      </fieldset>

      <fieldset>
        <legend>Photos</legend>
        <p className="form-note">The first photo is the cover. Upload JPG, PNG or WebP files of any size (large ones are shrunk automatically), or paste an image link.</p>
        {photos.length > 0 && (
          <ul className="pthumbs">
            {photos.map((src, i) => (
              <li key={src + i}>
                <span className="pt-img">
                  <Photo photo={{ src, alt: `Photo ${i + 1}` }} sizes="200px" />
                  {i === 0 && <span className="pill cover">Cover</span>}
                </span>
                <span className="pt-actions">
                  {i !== 0 && (
                    <button type="button" onClick={() => makeCover(i)}>
                      Make cover
                    </button>
                  )}
                  <button type="button" onClick={() => removePhoto(i)}>
                    Remove
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
        <div className="upload-row">
          <label className="btn plain filebtn">
            {uploading ?? "Upload photos"}
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={!!uploading || photos.length >= 12} onChange={(e) => uploadFiles(e.target.files)} />
          </label>
          <div className="urlrow">
            <input aria-label="Image link" value={urlInput} onChange={(e) => setUrlInput(e.target.value)} placeholder="https://…" onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addUrl(); } }} />
            <button type="button" className="btn plain" onClick={addUrl}>
              Add link
            </button>
          </div>
        </div>
        {photoError && (
          <p className="form-error" role="alert">
            {photoError}
          </p>
        )}
      </fieldset>

      <fieldset>
        <legend>Documents and payment</legend>
        <p className="form-note">Buyers abroad cannot visit, so they decide on trust. Tick only the documents you can show a buyer or their lawyer on request. Editing these later removes the Kolé &quot;checked&quot; mark until the admin looks again.</p>
        <div className="checks">
          {DOCS.map((d) => (
            <label key={d} className="check">
              <input type="checkbox" checked={docs.includes(d)} onChange={(e) => setDocs((cur) => (e.target.checked ? [...cur, d] : cur.filter((x) => x !== d)))} />
              <span>{d}</span>
            </label>
          ))}
        </div>
        {type === "house" && (
          <div className="fgrid two">
            <label className="field">
              <span>Build stage</span>
              <select value={stage} onChange={(e) => setStage(e.target.value as Stage)}>
                {STAGES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
            {stage !== "ready" && (
              <label className="field">
                <span>Expected handover</span>
                <input type="month" value={handover} onChange={(e) => setHandover(e.target.value)} />
              </label>
            )}
          </div>
        )}
        <label className="field">
          <span>Payment plan (optional)</span>
          <textarea rows={3} maxLength={500} value={paymentPlan} onChange={(e) => setPaymentPlan(e.target.value)} placeholder="e.g. 40% on subscription, balance in three stages tied to construction milestones. Payments go to a lawyer-held escrow account." />
        </label>
      </fieldset>

      <fieldset>
        <legend>360° tour (optional)</legend>
        <p className="form-note">Upload one panorama photo (a 2:1 wide image from a 360 camera or your phone&apos;s panorama mode, shrunk automatically if large). Clients get a walk-around tab on the listing. Every listing with two or more photos already gets the 3D photo view.</p>
        {panorama && (
          <p className="form-note">
            360 photo added. <button type="button" className="linkbtn" onClick={() => setPanorama("")}>Remove</button>
          </p>
        )}
        <label className="btn plain filebtn">
          {panoBusy ? "Uploading…" : panorama ? "Replace 360 photo" : "Upload 360 photo"}
          <input type="file" accept="image/jpeg,image/png,image/webp" disabled={panoBusy} onChange={(e) => uploadPano(e.target.files)} />
        </label>
      </fieldset>

      <fieldset>
        <legend>Publishing</legend>
        <div className="fgrid two">
          <label className="field">
            <span>Developer this property belongs to</span>
            <select value={developerId} onChange={(e) => setDeveloperId(e.target.value)} required>
              {developers.length === 0 && <option value="">No developers yet</option>}
              {developers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
            <small>
              Not in the list? <a href="/admin/developers">Add the developer first</a>.
            </small>
          </label>
          <label className="field">
            <span>Availability</span>
            <select value={status} onChange={(e) => setStatus(e.target.value as Property["status"])}>
              <option value="available">Available</option>
              <option value="reserved">Reserved</option>
              <option value="sold">{purpose === "rent" ? "Let" : "Sold"}</option>
            </select>
          </label>
        </div>
        <label className="check">
          <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} />
          <span>Show this listing on the site</span>
        </label>
        {isAdmin && (
          <label className="check">
            <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
            <span>Feature it on the home page</span>
          </label>
        )}
      </fieldset>

      <div className="pform-actions">
        <button className="btn solid" type="submit" disabled={saving || !!uploading}>
          {saving ? "Saving…" : editing ? "Save changes" : "Publish property"}
        </button>
        <button type="button" className="btn plain" onClick={() => router.push("/admin")}>
          Cancel
        </button>
      </div>
    </form>
  );
}
