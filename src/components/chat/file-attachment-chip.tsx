import { X, FileText, Image as ImageIcon } from "lucide-react";
import type { FileEntry } from "./use-chat-stream";

interface Props {
  file: FileEntry;
  onRemove: () => void;
}

export function FileAttachmentChip({ file, onRemove }: Props) {
  const isImage = file.type.startsWith("image/");
  return (
    <div className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-zinc-50 px-2.5 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-800">
      {isImage ? <ImageIcon className="size-3.5 text-zinc-500" /> : <FileText className="size-3.5 text-zinc-500" />}
      <span className="truncate max-w-[160px]">{file.name}</span>
      <button
        type="button"
        onClick={onRemove}
        className="size-4 rounded-md flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-700"
      >
        <X className="size-3" />
      </button>
    </div>
  );
}
