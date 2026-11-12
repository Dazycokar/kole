import crypto from "crypto";
import type { Db, Property, User } from "./types";
import { hashPassword } from "./password";
import type { DevType } from "./devtypes";

export const U = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1600&q=80`;

export const PH = {
  h1: U("1505843513577-22bb7d21e455"),
  h2: U("1757524492552-d47a66a2b63e"),
  h3: U("1613977257363-707ba9348227"),
  h4: U("1781795414968-8ece31826420"),
  h5: U("1706808849780-7a04fbac83ef"),
  h6: U("1783125127199-860da9744dcc"),
  h7: U("1600596542815-ffad4c1539a9"),
  h8: U("1580587771525-78b9dba3b914"),
  h9: U("1721815693498-cc28507c0ba2"),
  h10: U("1602343168117-bb8ffe3e2e9f"),
  h11: U("1628012209120-d9db7abf7eab"),
  h12: U("1670589953882-b94c9cb380f5"),
  tower: U("1757924432508-d4e92411caeb"),
  seaLiving: U("1758448511320-05d7d28f4298"),
  fireLiving: U("1757524503555-b62633f47670"),
  sofaLiving: U("1758448511322-8bfc73daf606"),
  marbleLiving: U("1598928506311-c55ded91a20c"),
  kitchen: U("1778731660397-6a66493be391"),
  land1: U("1747854805840-9be7d5e360e6"),
  land2: U("1773215023063-e662ea91a69c"),
  land3: U("1764222233275-87dc016c11dc"),
  land4: U("1655319446878-44e5c1e31551"),
  land5: U("1629460455571-c943339c4f23"),
};

export const HERO_PHOTO = U("1648023200201-8fcede127835");

const ago = (days: number) => new Date(Date.now() - days * 86400000).toISOString();

type Seed = Omit<Property, "id" | "status" | "featured" | "published" | "demo" | "createdAt" | "updatedAt" | "developerId" | "address" | "priceNote" | "titleDoc" | "subtype"> &
  Partial<Pick<Property, "status" | "featured" | "priceNote" | "titleDoc" | "address" | "subtype">> & { key: string; days: number; dev: 0 | 1 | 2 | 3 };

function sampleDocs(s: Seed): string[] {
  if (s.type === "house") return ["Certificate of Occupancy (C of O)", "Building approval / permit", "Survey plan"];
  const t = s.titleDoc ?? "";
  if (t.includes("C of O")) return ["Certificate of Occupancy (C of O)", "Survey plan"];
  if (t.includes("Governor")) return ["Governor's Consent", "Survey plan"];
  if (t.includes("Deed")) return ["Registered Deed of Assignment", "Survey plan"];
  return ["Survey plan"];
}

const DEVS: { name: string; email: string; devType: DevType; about: string }[] = [
  { name: "Aurum Court Developments", email: "sample.aurum@kole.local", devType: "luxury", about: "Sample developer. Waterfront and Ikoyi luxury residences." },
  { name: "Gidi Heights Limited", email: "sample.gidi@kole.local", devType: "commercial", about: "Sample developer. Towers and apartments on Lagos Island." },
  { name: "Capital Crest Homes", email: "sample.capital@kole.local", devType: "luxury", about: "Sample developer. Detached homes in Maitama, Asokoro and Guzape." },
  { name: "Terra Plots & Estates", email: "sample.terra@kole.local", devType: "estate", about: "Sample developer. Surveyed plots in Lagos and Abuja." },
];

const SAMPLES: Seed[] = [
  {
    key: "banana-mansion", days: 2, dev: 0, featured: true, type: "house", subtype: "Mansion", purpose: "sale", price: 1850000000,
    title: "Waterfront 6-bedroom mansion", city: "Lagos", area: "Banana Island", address: "Banana Island, Lagos",
    beds: 6, baths: 7, parking: 6, sizeSqm: 1100, plotSqm: 1500, developerName: DEVS[0].name,
    description: "A new-build waterfront mansion on Banana Island with double-height living spaces, a private jetty frontage, a cinema room and a staff quarters block. Finished with imported stone, full smart-home wiring and a generator house with automatic changeover.",
    features: ["Private pool", "Cinema room", "Smart home wiring", "Boys' quarters", "24-hour power backup", "Waterfront view"],
    photos: [PH.h4, PH.seaLiving, PH.kitchen],
  },
  {
    key: "ikoyi-duplex", days: 4, dev: 0, featured: true, type: "house", subtype: "Detached duplex", purpose: "sale", price: 850000000,
    title: "5-bedroom detached duplex with pool", city: "Lagos", area: "Ikoyi", address: "Old Ikoyi, Lagos",
    beds: 5, baths: 6, parking: 4, sizeSqm: 720, plotSqm: 1000, developerName: DEVS[0].name,
    description: "A freshly completed detached duplex in a quiet Ikoyi street. Open-plan ground floor, a family lounge upstairs, and a landscaped garden with a swimming pool. Each bedroom is en-suite with fitted wardrobes.",
    features: ["Swimming pool", "En-suite bedrooms", "Fitted kitchen", "Boys' quarters", "CCTV", "Water treatment plant"],
    photos: [PH.h3, PH.marbleLiving, PH.kitchen],
  },
  {
    key: "eko-penthouse", days: 6, dev: 1, featured: true, type: "house", subtype: "Penthouse", purpose: "sale", price: 1200000000,
    title: "Skyline penthouse with ocean views", city: "Lagos", area: "Eko Atlantic", address: "Eko Atlantic City, Lagos",
    beds: 4, baths: 5, parking: 3, sizeSqm: 480, developerName: DEVS[1].name,
    description: "A full-floor penthouse in a new tower with floor-to-ceiling glazing and unbroken Atlantic views. Residents share a rooftop pool, gym and concierge desk, with dedicated parking and central power.",
    features: ["Rooftop pool", "Gym", "Concierge", "Central power", "Ocean view", "Dedicated parking"],
    photos: [PH.tower, PH.seaLiving, PH.sofaLiving],
  },
  {
    key: "lekki-terrace", days: 9, dev: 1, type: "house", subtype: "Terrace duplex", purpose: "sale", price: 320000000,
    title: "Smart 4-bedroom terrace duplex", city: "Lagos", area: "Lekki Phase 1", address: "Lekki Phase 1, Lagos",
    beds: 4, baths: 5, parking: 2, sizeSqm: 340, plotSqm: 400, developerName: DEVS[1].name,
    description: "A terrace duplex in a gated estate of twelve homes, with solar-assisted power, a shared gym and round-the-clock security. Open kitchen, study room and a rooftop terrace.",
    features: ["Gated estate", "Solar-assisted power", "Shared gym", "Study room", "Rooftop terrace"],
    photos: [PH.h7, PH.fireLiving],
  },
  {
    key: "vi-flat", days: 12, dev: 1, type: "house", subtype: "Apartment", purpose: "rent", price: 18000000, priceNote: "per year",
    title: "3-bedroom serviced apartment", city: "Lagos", area: "Victoria Island", address: "Victoria Island, Lagos",
    beds: 3, baths: 4, parking: 2, sizeSqm: 210, developerName: DEVS[1].name,
    description: "A serviced apartment in a new block with a lift, standby generator, gym and 24-hour security. Fully fitted kitchen and ready for immediate occupancy.",
    features: ["Serviced", "Lift", "Gym", "Standby generator", "Ready to move in"],
    photos: [PH.h8, PH.sofaLiving],
  },
  {
    key: "chevron-semi", days: 15, dev: 0, type: "house", subtype: "Semi-detached duplex", purpose: "sale", price: 240000000,
    title: "4-bedroom semi-detached duplex", city: "Lagos", area: "Lekki (Chevron axis)", address: "Chevron Drive axis, Lekki",
    beds: 4, baths: 5, parking: 3, sizeSqm: 380, plotSqm: 450, developerName: DEVS[0].name,
    description: "A semi-detached duplex with a bright double-height entrance, a spacious family lounge and a boys' quarters. Close to the Lekki–Epe expressway and the Chevron corridor.",
    features: ["Boys' quarters", "Fitted wardrobes", "Wide driveway", "Estate security"],
    photos: [PH.h9, PH.marbleLiving],
  },
  {
    key: "ikate-home", days: 18, dev: 0, type: "house", subtype: "Detached duplex", purpose: "sale", price: 420000000,
    title: "Contemporary 5-bedroom home", city: "Lagos", area: "Ikate", address: "Ikate, Lekki",
    beds: 5, baths: 6, parking: 4, sizeSqm: 520, plotSqm: 700, developerName: DEVS[0].name,
    description: "A contemporary detached home with a pool terrace, a home office and a separate guest suite. Large glazed openings fill the living areas with daylight.",
    features: ["Swimming pool", "Home office", "Guest suite", "Smart locks"],
    photos: [PH.h5, PH.kitchen],
  },
  {
    key: "oniru-flat", days: 21, dev: 1, type: "house", subtype: "Apartment", purpose: "rent", price: 12000000, priceNote: "per year",
    title: "2-bedroom luxury flat", city: "Lagos", area: "Oniru", address: "Oniru, Victoria Island",
    beds: 2, baths: 3, parking: 1, sizeSqm: 150, developerName: DEVS[1].name,
    description: "A two-bedroom flat in a boutique block near the beach road. Fitted kitchen, balcony and a dedicated parking space.",
    features: ["Balcony", "Fitted kitchen", "Dedicated parking", "24-hour security"],
    photos: [PH.h11, PH.sofaLiving],
  },
  {
    key: "maitama-mansion", days: 3, dev: 2, featured: true, type: "house", subtype: "Mansion", purpose: "sale", price: 1500000000,
    title: "6-bedroom mansion in Maitama", city: "Abuja", area: "Maitama", address: "Maitama District, Abuja",
    beds: 6, baths: 7, parking: 8, sizeSqm: 950, plotSqm: 2000, developerName: DEVS[2].name,
    description: "A new mansion on a 2,000 sqm plot in Maitama. Formal and informal living rooms, an indoor cinema, a spa room, a two-bedroom annex and a landscaped garden with a pool.",
    features: ["Pool", "Cinema", "Spa room", "Two-bedroom annex", "Solar backup", "Landscaped garden"],
    photos: [PH.h1, PH.marbleLiving, PH.kitchen],
  },
  {
    key: "asokoro-detached", days: 7, dev: 2, type: "house", subtype: "Detached duplex", purpose: "sale", price: 980000000,
    title: "5-bedroom detached house in Asokoro", city: "Abuja", area: "Asokoro", address: "Asokoro District, Abuja",
    beds: 5, baths: 6, parking: 5, sizeSqm: 680, plotSqm: 1200, developerName: DEVS[2].name,
    description: "A detached house on a quiet Asokoro street with large reception rooms, a family kitchen, a study and a rooftop lounge. Private borehole and a standby power house.",
    features: ["Rooftop lounge", "Study", "Borehole", "Power house", "CCTV"],
    photos: [PH.h2, PH.fireLiving],
  },
  {
    key: "wuse-terrace", days: 11, dev: 2, type: "house", subtype: "Terrace duplex", purpose: "sale", price: 380000000,
    title: "4-bedroom terrace in Wuse II", city: "Abuja", area: "Wuse II", address: "Wuse II, Abuja",
    beds: 4, baths: 5, parking: 2, sizeSqm: 360, plotSqm: 420, developerName: DEVS[2].name,
    description: "A terrace duplex in a small gated development in Wuse II, minutes from restaurants and offices. Bright open-plan living and a private rear courtyard.",
    features: ["Gated development", "Private courtyard", "Fitted kitchen", "Ample parking"],
    photos: [PH.h10, PH.sofaLiving],
  },
  {
    key: "jabi-flat", days: 14, dev: 2, type: "house", subtype: "Apartment", purpose: "rent", price: 9000000, priceNote: "per year",
    title: "3-bedroom apartment near Jabi Lake", city: "Abuja", area: "Jabi", address: "Jabi, Abuja",
    beds: 3, baths: 3, parking: 2, sizeSqm: 190, developerName: DEVS[2].name,
    description: "A three-bedroom apartment in a new block with a pool, a gym and generator backup. A short walk from Jabi Lake Mall.",
    features: ["Pool", "Gym", "Generator", "Lift"],
    photos: [PH.h12, PH.fireLiving],
  },
  {
    key: "guzape-home", days: 19, dev: 2, type: "house", subtype: "Detached duplex", purpose: "sale", price: 720000000,
    title: "Contemporary 5-bedroom home in Guzape", city: "Abuja", area: "Guzape", address: "Guzape District, Abuja",
    beds: 5, baths: 6, parking: 4, sizeSqm: 600, plotSqm: 900, developerName: DEVS[2].name,
    description: "A contemporary home on the Guzape hills with a pool, a media room and views across the district. Built with a full smart-home system.",
    features: ["Pool", "Media room", "Smart home", "Hill view"],
    photos: [PH.h6, PH.marbleLiving],
  },
  {
    key: "land-chevron", days: 5, dev: 3, featured: true, type: "land", subtype: "Residential plot", purpose: "sale", price: 180000000,
    title: "600 sqm residential plot, Chevron axis", city: "Lagos", area: "Lekki (Chevron axis)", address: "Lekki, Lagos",
    plotSqm: 600, titleDoc: "Governor's Consent", developerName: DEVS[3].name,
    description: "A dry, fenced residential plot in a developing estate with tarred roads and drainage. Survey available and documents ready for inspection.",
    features: ["Dry land", "Fenced", "Tarred roads", "Survey available", "Estate security"],
    photos: [PH.land1, PH.land2],
  },
  {
    key: "land-ajah", days: 8, dev: 3, type: "land", subtype: "Residential plot", purpose: "sale", price: 95000000,
    title: "900 sqm plot in Ajah", city: "Lagos", area: "Ajah (Lekki axis)", address: "Ajah, Lagos",
    plotSqm: 900, titleDoc: "Deed of Assignment", developerName: DEVS[3].name,
    description: "A corner-piece residential plot in a fast-developing part of Ajah, close to the Lekki–Epe expressway. Registered survey, ready for building.",
    features: ["Corner piece", "Registered survey", "Close to expressway"],
    photos: [PH.land2, PH.land1],
  },
  {
    key: "land-maitama", days: 10, dev: 3, featured: true, type: "land", subtype: "Residential plot", purpose: "sale", price: 650000000,
    title: "1,200 sqm plot in Maitama", city: "Abuja", area: "Maitama", address: "Maitama District, Abuja",
    plotSqm: 1200, titleDoc: "Certificate of Occupancy (C of O)", developerName: DEVS[3].name,
    description: "A prime residential plot in Maitama with a certificate of occupancy and approved layout. Flat terrain, all utilities on the street.",
    features: ["Approved layout", "Flat terrain", "Utilities on street", "C of O"],
    photos: [PH.land3, PH.land4],
  },
  {
    key: "land-guzape", days: 13, dev: 3, type: "land", subtype: "Mixed-use plot", purpose: "sale", price: 420000000,
    title: "1,000 sqm mixed-use plot, Guzape", city: "Abuja", area: "Guzape", address: "Guzape District, Abuja",
    plotSqm: 1000, titleDoc: "Right of Occupancy (R of O)", developerName: DEVS[3].name,
    description: "A mixed-use plot suitable for apartments with ground-floor retail. On a main road with strong passing traffic.",
    features: ["Main road frontage", "Mixed-use approval", "R of O"],
    photos: [PH.land4, PH.land3],
  },
  {
    key: "land-katampe", days: 16, dev: 3, type: "land", subtype: "Residential plot", purpose: "sale", price: 260000000,
    title: "800 sqm plot in Katampe Extension", city: "Abuja", area: "Katampe Extension", address: "Katampe Extension, Abuja",
    plotSqm: 800, titleDoc: "Certificate of Occupancy (C of O)", developerName: DEVS[3].name,
    description: "A residential plot in an upcoming part of Abuja with good road access. Survey plan available and the title can be verified at the lands registry.",
    features: ["Road access", "Survey plan", "C of O"],
    photos: [PH.land5, PH.land4],
  },
];

export async function buildSeed(): Promise<Db> {
  const rand = () => crypto.randomBytes(9).toString("base64url");
  const now = new Date().toISOString();

  const adminEmail = (process.env.ADMIN_EMAIL || "admin@kole.local").trim().toLowerCase();
  const adminPass = process.env.ADMIN_PASSWORD || "ChangeMe123!";

  const admin: User = {
    id: rand(), name: "Site admin", email: adminEmail, passwordHash: await hashPassword(adminPass),
    role: "admin", status: "active", createdAt: now,
  };

  // Sample developers cannot be logged into: their password is random and never shown.
  const devUsers: User[] = [];
  for (const d of DEVS) {
    devUsers.push({
      id: rand(), name: d.name, email: d.email, passwordHash: await hashPassword(crypto.randomBytes(24).toString("hex")),
      role: "developer", company: d.name, devType: d.devType, about: d.about, status: "active", demo: true, createdAt: now,
    });
  }

  const properties: Property[] = SAMPLES.map((s) => ({
    id: s.key,
    title: s.title, type: s.type, subtype: s.subtype ?? "", purpose: s.purpose, price: s.price, priceNote: s.priceNote ?? "",
    city: s.city, area: s.area, address: s.address ?? "",
    beds: s.beds, baths: s.baths, parking: s.parking, sizeSqm: s.sizeSqm, plotSqm: s.plotSqm,
    titleDoc: s.titleDoc ?? "", description: s.description, features: s.features, photos: s.photos,
    stage: s.type === "house" ? "ready" : undefined,
    docs: sampleDocs(s),
    status: s.status ?? "available", featured: !!s.featured, published: true,
    developerId: devUsers[s.dev].id, developerName: s.developerName, demo: true,
    createdAt: ago(s.days), updatedAt: ago(s.days),
  }));

  return {
    meta: { secret: crypto.randomBytes(32).toString("hex"), createdAt: now },
    users: [admin, ...devUsers],
    properties,
    teams: [],
    threads: [],
    messages: [],
    saves: [],
    partnerRequests: [],
  };
}
