import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { MessageSquare } from "lucide-react";
import type { MessageRow } from "@/lib/api-client";
import { FileAttachmentInline } from "./file-attachment-inline";
import { HtmlCodeCard } from "./html-code-card";
import { ActivityTrace } from "./activity-trace";
import { cn, formatRelative } from "@/lib/utils";

interface Props {
  message: Pick<MessageRow, "role" | "content" | "files" | "createdAt" | "trace">;
  streaming?: boolean;
}

interface ContentSegment {
  type: "markdown" | "html";
  content: string;
}

/**
 * Tách fenced ```html ... ``` blocks ra khỏi markdown text TRƯỚC khi đưa vào
 * ReactMarkdown — tránh xung đột với rehype-highlight (nó biến code text
 * thành các <span> highlighted, làm mất raw source cần cho download/preview).
 * Block chưa đóng fence (đang stream dở) không match, tạm hiện raw trong
 * đoạn markdown cho tới khi fence đóng lại — không crash, chỉ là UI tạm thời.
 */
function splitHtmlBlocks(content: string): ContentSegment[] {
  const regex = /```html\s*\n([\s\S]*?)```/gi;
  const segments: ContentSegment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: "markdown", content: content.slice(lastIndex, match.index) });
    }
    segments.push({ type: "html", content: match[1].trim() });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < content.length) {
    segments.push({ type: "markdown", content: content.slice(lastIndex) });
  }
  return segments;
}

export function MessageBubble({ message, streaming = false }: Props) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex w-full justify-end" style={{ animation: "fadeInUp 0.3s ease both" }}>
        <div className="max-w-[75%] rounded-2xl bg-brand px-4 py-2.5 text-sm text-white">
          <div className="whitespace-pre-wrap break-words">{message.content}</div>
          {message.files && message.files.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {message.files.map((f) => (
                <FileAttachmentInline key={f.alias} file={f} />
              ))}
            </div>
          )}
          {message.createdAt && (
            <div className="mt-1 text-right text-[10px] text-white/70">
              {formatRelative(message.createdAt)}
            </div>
          )}
        </div>
      </div>
    );
  }

  const segments = splitHtmlBlocks(message.content);
  const persistedTrace = message.trace;

  return (
    <div className="flex w-full items-start gap-2.5" style={{ animation: "fadeInUp 0.3s ease both" }}>
      <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-brand text-white">
        <MessageSquare className="size-3.5" strokeWidth={2.25} />
      </div>
      <div className="max-w-[80%] rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-900">
        {persistedTrace && persistedTrace.length > 0 && (
          <ActivityTrace trace={persistedTrace} defaultCollapsed />
        )}
        <div
          className={cn(
            "prose prose-sm dark:prose-invert max-w-none space-y-2.5",
            // Cursor gắn vào cuối dòng text CUỐI CÙNG qua ::after — tránh
            // orphan thành 1 block riêng bên dưới (trước đó dùng <span> rời,
            // bị `space-y` đẩy xuống dòng mới trông như thanh trôi nổi).
            streaming &&
              "[&>*:last-child]:after:ml-1 [&>*:last-child]:after:inline-block [&>*:last-child]:after:h-3.5 [&>*:last-child]:after:w-1 [&>*:last-child]:after:translate-y-0.5 [&>*:last-child]:after:animate-pulse [&>*:last-child]:after:rounded-sm [&>*:last-child]:after:bg-brand [&>*:last-child]:after:align-middle [&>*:last-child]:after:content-['']",
          )}
        >
          {segments.map((seg, i) =>
            seg.type === "html" ? (
              <HtmlCodeCard key={i} code={seg.content} />
            ) : seg.content.trim() ? (
              <ReactMarkdown key={i} remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                {seg.content}
              </ReactMarkdown>
            ) : null,
          )}
        </div>
        {message.files && message.files.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {message.files.map((f) => (
              <FileAttachmentInline key={f.alias} file={f} />
            ))}
          </div>
        )}
        {message.createdAt && (
          <div className="mt-1 text-[10px] text-zinc-400">{formatRelative(message.createdAt)}</div>
        )}
      </div>
    </div>
  );
}
