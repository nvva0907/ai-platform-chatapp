"use client";

import { useState } from "react";
import { Clock, Wrench, CheckCircle2, Info, ChevronDown, ChevronUp } from "lucide-react";
import type { TraceEntry } from "./use-chat-stream";

interface Props {
  trace: TraceEntry[];
  /** true = thu gọn ngay từ đầu (dùng cho trace của message đã persist).
   * Mặc định false (mở, dùng lúc đang stream để user thấy tiến trình). */
  defaultCollapsed?: boolean;
}

/** Nhóm thinking/tool-call/status vào 1 khối riêng, tách khỏi câu trả lời
 * cuối cùng — giống UI trace của Claude. Chỉ tồn tại trong session hiện tại
 * (ephemeral, KHÔNG persist DB) — reload trang sẽ không thấy lại. */
export function ActivityTrace({ trace, defaultCollapsed = false }: Props) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  if (trace.length === 0) return null;

  return (
    <div className="mb-2 rounded-xl border border-zinc-200 bg-zinc-50/60 dark:border-zinc-700 dark:bg-zinc-800/30">
      <button
        type="button"
        onClick={() => setCollapsed((v) => !v)}
        className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-zinc-500"
      >
        <span>Quá trình xử lý</span>
        <span className="text-zinc-400">({trace.length})</span>
        {collapsed ? (
          <ChevronDown className="ml-auto size-3.5" />
        ) : (
          <ChevronUp className="ml-auto size-3.5" />
        )}
      </button>
      {!collapsed && (
        <div className="space-y-2.5 border-t border-zinc-200 px-3 py-2.5 dark:border-zinc-700">
          {trace.map((entry) => (
            <TraceRow key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}

function TraceRow({ entry }: { entry: TraceEntry }) {
  if (entry.type === "thinking") {
    return (
      <div className="flex items-start gap-2">
        <Clock className="mt-0.5 size-3.5 shrink-0 text-zinc-400" />
        <p className="text-xs italic leading-relaxed text-zinc-500 dark:text-zinc-400">{entry.text}</p>
      </div>
    );
  }
  if (entry.type === "tool") {
    return (
      <div className="flex items-center gap-2">
        {entry.status === "running" ? (
          <Wrench className="size-3.5 shrink-0 animate-pulse text-brand" />
        ) : (
          <CheckCircle2 className="size-3.5 shrink-0 text-emerald-500" />
        )}
        <span className="text-xs text-zinc-600 dark:text-zinc-300">
          {entry.status === "running" ? "Đang dùng" : "Đã dùng"} công cụ{" "}
          <span className="font-mono font-medium">{entry.toolName}</span>
        </span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <Info className="size-3.5 shrink-0 text-zinc-400" />
      <span className="text-xs text-zinc-500">{entry.text}</span>
    </div>
  );
}
