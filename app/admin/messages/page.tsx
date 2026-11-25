import type { Metadata } from "next";
import ChatInbox from "@/components/ChatInbox";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Messages" };

export default function AdminMessages({ searchParams }: { searchParams: { thread?: string } }) {
  return (
    <>
      <div className="sec-head slim">
        <h2>Client messages</h2>
        <p>Buyers ask Kolé about a property here. Each conversation shows which team is attending to the buyer. Team members see their own team's conversations; the admin sees all of them.</p>
      </div>
      <ChatInbox mode="staff" initialThreadId={searchParams.thread} />
    </>
  );
}
