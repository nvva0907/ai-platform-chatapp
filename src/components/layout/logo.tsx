import { MessageSquare } from "lucide-react";

export function Logo({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className="size-7 rounded-lg bg-brand text-white flex items-center justify-center shrink-0">
        <MessageSquare className="size-3.5" strokeWidth={2.25} />
      </div>
      {!collapsed && <span className="font-bold text-[15px]">Chat</span>}
    </div>
  );
}
