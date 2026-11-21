import type { Db, Property } from "./types";

/** The fields a buyer's app may see. Developer contact details never leave the server. */
export function publicProperty(db: Db, p: Property) {
  const dev = db.users.find((u) => u.id === p.developerId);
  return {
    id: p.id, title: p.title, type: p.type, subtype: p.subtype, purpose: p.purpose,
    price: p.price, priceNote: p.priceNote, city: p.city, area: p.area, address: p.address,
    beds: p.beds, baths: p.baths, parking: p.parking, sizeSqm: p.sizeSqm, plotSqm: p.plotSqm,
    titleDoc: p.titleDoc, description: p.description, features: p.features, photos: p.photos, panorama: p.panorama, videos: p.videos ?? [],
    stage: p.stage, handover: p.handover, paymentPlan: p.paymentPlan, docs: p.docs ?? [], verified: !!p.verified,
    status: p.status, featured: p.featured, demo: !!p.demo, developerName: p.developerName,
    developerVerified: !!dev?.verified, developerType: dev?.devType,
  };
}
