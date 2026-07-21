import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAnonId } from "@/lib/anon-id";

export default async function Home() {
  const anonId = await getAnonId();
  if (!anonId) {
    // Middleware should have set cookie by now, but bail-safe rendering
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <p className="text-sm text-zinc-500">Đang khởi tạo phiên...</p>
      </div>
    );
  }
  // Redirect to latest thread if exists, else render empty state (user clicks New chat)
  const latest = await prisma.thread.findFirst({
    where: { anonymousId: anonId, archivedAt: null },
    orderBy: { lastMessageAt: "desc" },
    select: { id: true },
  });
  if (latest) {
    redirect(`/c/${latest.id}`);
  }
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <h1 className="text-xl font-semibold mb-2">Chào mừng.</h1>
        <p className="text-sm text-zinc-500">
          Nhấn &quot;New chat&quot; ở thanh bên để bắt đầu.
        </p>
      </div>
    </div>
  );
}
