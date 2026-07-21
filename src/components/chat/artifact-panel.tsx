"use client";

import { useEffect, useState } from "react";
import { Eye, Code2, Copy, Check, X } from "lucide-react";
import { useArtifact } from "./artifact-context";
import { cn } from "@/lib/utils";

type Tab = "preview" | "raw";

/** Split-panel bên phải ChatPanel (không backdrop, không dim nền — chat vẫn
 * dùng được song song), giống Claude artifact viewer. Ẩn hoàn toàn khi
 * không có artifact nào đang mở. */
export function ArtifactPanel() {
  const { artifact, closeArtifact } = useArtifact();
  const [tab, setTab] = useState<Tab>("preview");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (artifact) setTab("preview");
  }, [artifact]);

  if (!artifact) return null;

  const copyRaw = () => {
    navigator.clipboard.writeText(artifact.html).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div className="flex h-full w-[45%] min-w-[420px] max-w-[720px] shrink-0 flex-col border-l border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
      {/* Header — icon toggle Eye/Code thay vì tab chữ */}
      <div className="flex h-14 shrink-0 items-center gap-2 border-b border-zinc-200 px-3 dark:border-zinc-700">
        <div className="flex items-center gap-0.5 rounded-lg bg-zinc-100 p-0.5 dark:bg-zinc-800">
          <button
            type="button"
            onClick={() => setTab("preview")}
            title="Xem trước"
            className={cn(
              "flex size-7 items-center justify-center rounded-md transition-colors",
              tab === "preview"
                ? "bg-white text-brand shadow-sm dark:bg-zinc-700"
                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300",
            )}
          >
            <Eye className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => setTab("raw")}
            title="Raw"
            className={cn(
              "flex size-7 items-center justify-center rounded-md transition-colors",
              tab === "raw"
                ? "bg-white text-brand shadow-sm dark:bg-zinc-700"
                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300",
            )}
          >
            <Code2 className="size-4" />
          </button>
        </div>
        <span className="min-w-0 truncate text-sm font-medium">
          {artifact.title} <span className="text-zinc-400">· HTML</span>
        </span>
        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={copyRaw}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-300 px-2.5 py-1.5 text-xs font-medium hover:bg-zinc-50 dark:border-zinc-600 dark:hover:bg-zinc-800"
          >
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            Copy
          </button>
          <button
            type="button"
            onClick={closeArtifact}
            className="flex size-7 items-center justify-center rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>

      {/* Body */}
      {tab === "preview" ? (
        // sandbox="allow-scripts" only — iframe content không truy cập được
        // cookie/localStorage/DOM của app chính.
        <iframe
          srcDoc={artifact.html}
          title={artifact.title}
          sandbox="allow-scripts"
          className="w-full flex-1 bg-white"
        />
      ) : (
        <pre className="flex-1 overflow-auto bg-zinc-50 p-4 text-xs font-mono leading-relaxed dark:bg-zinc-950">
          <code>{artifact.html}</code>
        </pre>
      )}
    </div>
  );
}
