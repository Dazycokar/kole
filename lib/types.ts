import type { DevType, Stage } from "./devtypes";

export type Role = "client" | "developer" | "admin" | "agent";
export type UserStatus = "active" | "pending" | "suspended";

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  phone?: string;
  company?: string;
  /** Developer profile. */
  devType?: DevType;
  about?: string;
  rcNumber?: string;
  /** Set by the admin after checking this developer. */
  verified?: boolean;
  /** Clients: where they live, so developers know the time zone and can plan a video tour. */
  country?: string;
  /** Agents: the Kolé team they work in. */
  teamId?: string;
  /** Developer partners only: private contact for the Kolé team. Never shown to buyers. */
  contactEmail?: string;
  status: UserStatus;
  demo?: boolean;
  createdAt: string;
}
export type PublicUser = Omit<User, "passwordHash">;

export type PropType = "house" | "land";
export type Purpose = "sale" | "rent";
export type PStatus = "available" | "reserved" | "sold";

export interface Property {
  id: string;
  title: string;
  type: PropType;
  subtype: string;
  purpose: Purpose;
  price: number;
  priceNote: string;
  city: string;
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
  /** Optional 2:1 equirectangular photo for the 360 tour. */
  panorama?: string;
  /** Buildings only. */
  stage?: Stage;
  /** Expected handover month, YYYY-MM. */
  handover?: string;
  paymentPlan?: string;
  /** Documents the developer says are available to show. */
  docs?: string[];
  /** Set by the admin after seeing the documents. Cleared when a developer edits the title or documents. */
  verified?: boolean;
  status: PStatus;
  featured: boolean;
  published: boolean;
  developerId: string;
  developerName: string;
  demo?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Thread {
  id: string;
  propertyId: string;
  clientId: string;
  createdAt: string;
  updatedAt: string;
  clientReadAt: string;
  staffReadAt: string;
  /** The Kolé team attending to this client on this property. */
  teamId?: string;
}
export interface Team {
  id: string;
  name: string;
  /** Short line the client sees, e.g. "Ikoyi and Lagos Island homes". */
  focus?: string;
  /** Areas or cities this team covers. New enquiries about them go to this team first. */
  areas: string[];
  createdAt: string;
}

export interface Message {
  id: string;
  threadId: string;
  senderId: string;
  senderRole: "client" | "staff";
  /** Who wrote it, as they were named at the time. */
  agentName?: string;
  teamName?: string;
  body: string;
  createdAt: string;
}

export interface Db {
  meta: { secret: string; createdAt: string };
  users: User[];
  properties: Property[];
  teams: Team[];
  threads: Thread[];
  messages: Message[];
  saves: Save[];
  partnerRequests: PartnerRequest[];
}

export interface PartnerRequest {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  message: string;
  createdAt: string;
  handled: boolean;
}

export interface Save {
  userId: string;
  propertyId: string;
  createdAt: string;
}

export interface ThreadSummary {
  id: string;
  propertyId: string;
  propertyTitle: string;
  propertyPhoto: string;
  propertyArea: string;
  counterpart: string;
  counterpartNote?: string;
  teamId?: string;
  teamName?: string;
  lastMessage: { body: string; createdAt: string; mine: boolean } | null;
  unread: number;
  updatedAt: string;
}

export interface ChatMessage extends Message {
  senderName: string;
}
