"use client";

import { Code2, Download, Eye } from "lucide-react";
import { useArtifact } from "./artifact-context";

/** Lấy <title> trong HTML làm tên hiển thị. Fallback nếu không có. */
function extractTitle(html: string): string {
  const m = /<title[^>]*>([^<]*)<\/title>/i.exec(html);
  const t = m?.[1]?.trim();
  return t && t.length > 0 ? t : "Đoạn mã HTML";
}

function safeFileName(title: string): string {
  const slug = title.replace(/[^a-zA-Z0-9_-]+/g, "_").replace(/^_+|_+$/g, "");
  return `${slug.slice(0, 60) || "page"}.html`;
}

export function HtmlCodeCard({ code }: { code: string }) {
  const { openArtifact } = useArtifact();
  const title = extractTitle(code);

  const download = () => {
    const blob = new Blob([code], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = safeFileName(title);
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="not-prose flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-800/50">
      <div className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-700">
        <Code2 className="size-4 text-zinc-400" strokeWidth={1.75} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold">{title}</div>
        <div className="text-xs text-zinc-500">Code · HTML</div>
      </div>
      <div className="flex shrink-0 gap-1.5">
        <button
          type="button"
          onClick={() => openArtifact({ html: code, title })}
          className="flex items-center gap-1.5 rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium hover:bg-zinc-50 dark:border-zinc-600 dark:hover:bg-zinc-700"
        >
          <Eye className="size-3.5" /> Xem trước
        </button>
        <button
          type="button"
          onClick={download}
          className="flex items-center gap-1.5 rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium hover:bg-zinc-50 dark:border-zinc-600 dark:hover:bg-zinc-700"
        >
          <Download className="size-3.5" /> Tải xuống
        </button>
      </div>
    </div>
  );
}
