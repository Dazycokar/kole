import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getUser, isStaff } from "@/lib/auth";
import ChatInbox from "@/components/ChatInbox";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Messages" };

export default async function Chat({ searchParams }: { searchParams: { thread?: string } }) {
  const user = await getUser();
  if (!user) redirect("/login?next=/chat");
  if (isStaff(user)) redirect("/admin/messages");
  return (
    <main className="page">
      <div className="wrap">
        <div className="sec-head">
          <h2>Your messages</h2>
          <p>Your chats with the Kolé team, one for each property you asked about.</p>
        </div>
        <ChatInbox mode="client" initialThreadId={searchParams.thread} />
      </div>
    </main>
  );
}
