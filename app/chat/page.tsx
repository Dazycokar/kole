import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getUser, isStaff } from "@/lib/auth";
import ChatInbox from "@/components/ChatInbox";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Messages" };

export default async function Chat({ searchParams }: { searchParams: { thread?: string } }) {
  const user = await getUser();
  if (!user) redirect("/login?next=/chat");
  if (isStaff(user)) redirect("/admin/messages");
  return (
    <main className="page message-page">
      <div className="wrap">
        <div className="message-intro">
          <div>
            <p className="kicker-d">Your Kolé conversations</p>
            <h1>Good decisions start with a conversation.</h1>
            <p>Ask about a home, a viewing, or the paperwork. Your messages stay with the property, and the Kolé team will bring you clear answers.</p>
          </div>
          <Link className="btn plain message-browse" href="/buildings">Explore properties</Link>
        </div>
        <ChatInbox mode="client" initialThreadId={searchParams.thread} />
      </div>
    </main>
  );
}
