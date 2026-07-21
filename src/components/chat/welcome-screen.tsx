"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Logo } from "@/components/layout/logo";

interface Suggestion {
  title: string;
  subtitle: string;
  prompt: string;
}

const SUGGESTIONS: Suggestion[] = [
  {
    title: "Tóm tắt tài liệu",
    subtitle: "Rút gọn nội dung dài thành gạch đầu dòng",
    prompt: "Hãy tóm tắt tài liệu này thành các gạch đầu dòng chính",
  },
  {
    title: "Viết email chuyên nghiệp",
    subtitle: "Soạn email phản hồi khách hàng",
    prompt: "Soạn giúp tôi một email phản hồi khách hàng một cách chuyên nghiệp",
  },
  {
    title: "Phân tích dữ liệu",
    subtitle: "Giải thích số liệu trong bảng của bạn",
    prompt: "Giúp tôi phân tích và giải thích số liệu trong bảng dữ liệu này",
  },
  {
    title: "Lên ý tưởng",
    subtitle: "Brainstorm cho công việc hoặc dự án",
    prompt: "Giúp tôi lên ý tưởng cho dự án sắp tới",
  },
];

interface Props {
  onPickSuggestion: (prompt: string) => void;
}

export function WelcomeScreen({ onPickSuggestion }: Props) {
  const meta = useQuery({ queryKey: ["agent-meta"], queryFn: () => apiClient.agentMeta() });

  return (
    <div className="flex-1 min-h-0 overflow-y-auto p-8">
      <div
        className="mx-auto max-w-2xl pt-10"
        style={{ animation: "fadeInUp 0.4s ease both" }}
      >
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-brand/10">
          <Logo collapsed />
        </div>
        <h1 className="mb-2 text-center text-2xl font-extrabold text-balance">
          {meta.data?.welcome_message || "Xin chào, tôi có thể giúp gì cho bạn?"}
        </h1>
        <p className="mb-6 text-center text-sm text-zinc-500">
          Chọn một gợi ý dưới đây hoặc đặt câu hỏi của riêng bạn.
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s.title}
              type="button"
              onClick={() => onPickSuggestion(s.prompt)}
              className="rounded-xl border border-zinc-200 bg-white p-4 text-left transition-[transform,border-color,box-shadow] hover:-translate-y-0.5 hover:border-brand hover:shadow-md dark:border-zinc-700 dark:bg-zinc-900"
            >
              <div className="mb-1 text-sm font-bold">{s.title}</div>
              <div className="text-[12.5px] leading-snug text-zinc-500">{s.subtitle}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
