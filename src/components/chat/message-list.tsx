"use client";

import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { MessageSquare } from "lucide-react";
import { apiClient, type MessageRow } from "@/lib/api-client";
import { MessageBubble } from "./message-bubble";
import { TypingIndicator } from "./typing-indicator";
import { WelcomeScreen } from "./welcome-screen";
import { ActivityTrace } from "./activity-trace";
import type { TraceEntry, OptimisticUserMessage } from "./use-chat-stream";

interface Props {
  threadId: string;
  streamingContent: string;
  trace: TraceEntry[];
  isStreaming: boolean;
  optimisticUserMessage: OptimisticUserMessage | null;
  onPickSuggestion: (prompt: string) => void;
}

export function MessageList({
  threadId,
  streamingContent,
  trace,
  isStreaming,
  optimisticUserMessage,
  onPickSuggestion,
}: Props) {
  const q = useQuery({
    queryKey: ["messages", threadId],
    queryFn: () => apiClient.messages.list(threadId),
  });
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevMessageCountRef = useRef(0);
  const prevIsStreamingRef = useRef(false);

  const messages: MessageRow[] = q.data?.messages || [];

  // Auto-scroll CHỈ khi có tin nhắn mới thật sự (persisted messages tăng số
  // lượng) hoặc khi bắt đầu 1 lượt gửi mới (isStreaming false→true) — KHÔNG
  // scroll theo từng token trong lúc đang stream, để người dùng đọc thoải mái
  // mà không bị kéo xuống liên tục.
  useEffect(() => {
    const messagesGrew = messages.length > prevMessageCountRef.current;
    const streamingJustStarted = isStreaming && !prevIsStreamingRef.current;
    if ((messagesGrew || streamingJustStarted) && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
    prevMessageCountRef.current = messages.length;
    prevIsStreamingRef.current = isStreaming;
  }, [messages.length, isStreaming]);

  const isEmpty = messages.length === 0 && !isStreaming && !optimisticUserMessage;

  if (q.isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-zinc-500">
        Đang tải lịch sử…
      </div>
    );
  }

  if (isEmpty) return <WelcomeScreen onPickSuggestion={onPickSuggestion} />;

  return (
    <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-4 py-6">
      <div className="mx-auto flex max-w-4xl flex-col gap-5">
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}
        {optimisticUserMessage && (
          <MessageBubble
            message={{
              role: "user",
              content: optimisticUserMessage.content,
              files: optimisticUserMessage.files.map((f) => ({
                alias: f.alias,
                filename: f.name,
                content_type: f.type,
                size_bytes: f.size,
              })),
              createdAt: new Date().toISOString(),
              trace: null,
            }}
          />
        )}
        {isStreaming && (
          <div>
            <ActivityTrace trace={trace} />
            {streamingContent.length === 0 && trace.length === 0 && (
              <div className="flex items-start gap-2.5">
                <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-brand text-white">
                  <MessageSquare className="size-3.5" strokeWidth={2.25} />
                </div>
                <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900">
                  <TypingIndicator />
                </div>
              </div>
            )}
            {streamingContent.length > 0 && (
              <MessageBubble
                message={{
                  role: "assistant",
                  content: streamingContent,
                  files: [],
                  createdAt: new Date().toISOString(),
                  trace: null,
                }}
                streaming
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
