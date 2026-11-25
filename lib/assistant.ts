import { newId } from "./ids";
import { onlineAgents, routeTeam, teamOnline } from "./presence";
import { nairaShort, statusLabel } from "./format";
import type { Db, Message, Property, Thread } from "./types";

export const ASSISTANT = "Kolé assistant";
const HOURS = process.env.KOLE_HOURS || "9am to 6pm, Lagos time";

function note(db: Db, t: Thread, body: string, now: string): Message {
  const team = db.teams.find((x) => x.id === t.teamId);
  const m: Message = { id: newId(), threadId: t.id, senderId: "system", senderRole: "system", agentName: ASSISTANT, teamName: team?.name, body, createdAt: now };
  db.messages.push(m);
  return m;
}

/** The automatic first message, sent before anyone from the team has said a word. */
export function greet(db: Db, t: Thread, p: Property, now: string): Message {
  const team = db.teams.find((x) => x.id === t.teamId);
  const on = teamOnline(db, t.teamId);
  const who = team ? onlineAgents(db, team.id).map((u) => u.name.split(" ")[0]) : [];
  const share = "You can send photos, documents and files in this chat with the paperclip.";
  let body: string;
  if (!team) body = `Hi, welcome to Kolé. Thanks for asking about ${p.title}. Our team will pick this up and reply here as soon as someone is free. ${share}`;
  else if (on) body = `Hi, welcome to Kolé. Thanks for asking about ${p.title}. The ${team.name} team is online right now${who.length ? ` (${who.slice(0, 2).join(" and ")})` : ""} and I'm passing your chat to them. Someone will reply here in a moment. ${share}`;
  else body = `Hi, welcome to Kolé. Thanks for asking about ${p.title}. Nobody on our team is online at this moment. I've passed your chat to the ${team.name} team and they'll reply here as soon as they're back. We're usually online ${HOURS}. ${share}`;
  return note(db, t, body, now);
}

const HUMAN_FOLLOW_UP = "I can’t confirm that automatically, so I’ve passed your question to the Kolé team. They’ll follow up here.";

function answerFromListing(p: Property, question: string): string | null {
  const q = question.toLowerCase();
  if (/\b(available|availability|reserved|sold|let)\b/.test(q)) {
    return `The listing is currently marked ${statusLabel(p)}. The Kolé team can confirm the latest status.`;
  }
  if (/\b(price|cost|how much|asking price)\b|\b(monthly rent|rent amount)\b/.test(q)) {
    return `The listed price is ${nairaShort(p.price)}${p.priceNote ? ` ${p.priceNote}` : ""}.`;
  }
  if (/\b(bed|bedroom|bath|bathroom|parking|garage)\b/.test(q) && p.type === "house") {
    const facts = [
      p.beds !== undefined ? `${p.beds} bedroom${p.beds === 1 ? "" : "s"}` : "",
      p.baths !== undefined ? `${p.baths} bathroom${p.baths === 1 ? "" : "s"}` : "",
      p.parking !== undefined ? `${p.parking} parking space${p.parking === 1 ? "" : "s"}` : "",
    ].filter(Boolean);
    return facts.length ? `The listing shows ${facts.join(", ")}.` : null;
  }
  if (/\b(where|location|located|area|address)\b/.test(q)) {
    return `The property is in ${p.area}, ${p.city}.`;
  }
  if (/\b(size|sqm|square metre|square meter|plot|land area)\b/.test(q)) {
    const area = p.type === "land" ? p.plotSqm : p.sizeSqm;
    return area ? `The listed ${p.type === "land" ? "plot" : "property"} size is ${area.toLocaleString("en-US")} sqm.` : null;
  }
  if (/\b(document|title|certificate|deed|c of o|governor'?s consent)\b/.test(q)) {
    const docs = [p.titleDoc, ...(p.docs ?? [])].filter(Boolean);
    if (!docs.length) return "The listing doesn’t specify its title documents. The Kolé team can confirm what is available to review.";
    return `The listing mentions: ${[...new Set(docs)].join(", ")}. The team can share details and help you verify them.`;
  }
  if (/\b(payment plan|installment|instalment|mortgage)\b/.test(q)) {
    return p.paymentPlan
      ? `The listing states this payment plan: ${p.paymentPlan}. The team can confirm the current terms.`
      : "A payment plan isn’t specified in the listing. The Kolé team can confirm the available terms.";
  }
  if (/\b(inspection|inspect|viewing|view it|visit|tour)\b/.test(q)) {
    return "The Kolé team can help arrange a viewing. Tell us what day and time work for you.";
  }
  if (/\b(feature|amenit|include|included|has a|has an)\b/.test(q)) {
    return p.features.length
      ? `The listing mentions: ${p.features.join(", ")}. Ask the team if you need more detail.`
      : null;
  }
  return null;
}

function fallbackReply(p: Property, question: string): string {
  const faq = answerFromListing(p, question);
  if (faq) return faq;
  const greeting = question.toLowerCase().replace(/[^a-z0-9\s]/g, " ").trim().replace(/\s+/g, " ");
  if (/^(hi|hello|hey|hiya|howdy|good morning|good afternoon|good evening)( there)?( kole)?$/.test(greeting)) {
    return `Hi! I’m ${ASSISTANT}. I can help with details about ${p.title}, including the price, location, features and viewing options. What would you like to know?`;
  }
  return HUMAN_FOLLOW_UP;
}

/** Keep the assistant in the conversation until a staff member replies. */
export async function respondToClient(p: Property, history: Pick<Message, "senderRole" | "body">[]): Promise<string> {
  const question = history[history.length - 1]?.body.trim() ?? "";
  if (!question) return "Thanks for sharing that. The Kolé team will review it and follow up here.";

  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) return fallbackReply(p, question);
  const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
  const listing = {
    title: p.title,
    type: p.type,
    purpose: p.purpose,
    price: nairaShort(p.price),
    priceNote: p.priceNote,
    area: p.area,
    city: p.city,
    status: statusLabel(p),
    beds: p.beds,
    baths: p.baths,
    parking: p.parking,
    sizeSqm: p.sizeSqm,
    plotSqm: p.plotSqm,
    titleDoc: p.titleDoc,
    docs: p.docs,
    paymentPlan: p.paymentPlan,
    features: p.features,
  };
  const messages = [
    {
      role: "system",
      content: `You are Kolé's property enquiry assistant. Reply briefly and warmly. Use only the supplied listing facts and chat; never invent or imply unlisted facts. For legal, title verification, investment guarantees, payments, negotiation, exact addresses, or anything not confirmed, say the Kolé team will confirm. Do not claim a human has read the message or that a viewing is booked. Ask one short follow-up if it helps.\n\nConfirmed listing details:\n${JSON.stringify(listing)}`,
    },
    ...history.slice(-8).map((m) => ({
      role: m.senderRole === "client" ? "user" : "assistant",
      content: m.body.slice(0, 1000),
    })),
  ];

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model, messages, max_tokens: 180, temperature: 0.2 }),
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) {
      console.error(`OpenAI chat reply returned HTTP ${response.status}.`);
      return fallbackReply(p, question);
    }
    const payload = (await response.json()) as { choices?: { message?: { content?: unknown } }[] };
    const content = payload.choices?.[0]?.message?.content;
    if (typeof content !== "string" || !content.trim()) {
      console.error("OpenAI chat reply did not contain a message.");
      return fallbackReply(p, question);
    }
    return content.trim().slice(0, 1200);
  } catch (error) {
    console.error("OpenAI chat reply request failed.", error);
    return fallbackReply(p, question);
  }
}

/** Until a person from the team has replied, a chat sitting with an offline team moves to a team that is online. Returns the note it posted, if any. */
export function rerouteIfNeeded(db: Db, t: Thread, p: Property, now: string): Message | null {
  if (db.messages.some((m) => m.threadId === t.id && m.senderRole === "staff")) return null;
  if (teamOnline(db, t.teamId)) return null;
  const r = routeTeam(db, p);
  if (!r.online || !r.teamId || r.teamId === t.teamId) return null;
  t.teamId = r.teamId;
  const team = db.teams.find((x) => x.id === r.teamId)!;
  return note(db, t, `Good news: the ${team.name} team is online now, so I've moved your chat to them. They'll reply here shortly.`, now);
}
