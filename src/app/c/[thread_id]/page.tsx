import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAnonId } from "@/lib/anon-id";
import { ChatPanel } from "@/components/chat/chat-panel";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ thread_id: string }>;
}) {
  const { thread_id } = await params;
  const anonId = await getAnonId();
  if (!anonId) notFound();
  const thread = await prisma.thread.findUnique({ where: { id: thread_id } });
  if (!thread || thread.anonymousId !== anonId) notFound();

  return <ChatPanel threadId={thread_id} />;
}
