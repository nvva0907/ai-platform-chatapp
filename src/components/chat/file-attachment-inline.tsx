import { FileText, Image as ImageIcon } from "lucide-react";
import type { MessageRow } from "@/lib/api-client";

type FileMeta = MessageRow["files"][number];

function humanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

export function FileAttachmentInline({ file }: { file: FileMeta }) {
  const isImage = file.content_type.startsWith("image/");
  return (
    <div className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-800">
      {isImage ? <ImageIcon className="size-3.5 text-zinc-500" /> : <FileText className="size-3.5 text-zinc-500" />}
      <span className="truncate max-w-[200px]">{file.filename}</span>
      <span className="text-zinc-400">{humanSize(file.size_bytes)}</span>
    </div>
  );
}
