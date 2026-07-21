"use client";

import { useRef, useState, type KeyboardEvent, type ChangeEvent, type DragEvent } from "react";
import { Paperclip, Send } from "lucide-react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/input";
import { aliasFromFilename } from "@/lib/utils";
import { FileAttachmentChip } from "./file-attachment-chip";
import type { FileEntry } from "./use-chat-stream";

const MAX_FILES = 5;
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MAX_TOTAL_BYTES = 20 * 1024 * 1024;

interface Props {
  disabled?: boolean;
  onSend: (message: string, files: FileEntry[]) => void;
}

export function Composer({ disabled, onSend }: Props) {
  const [text, setText] = useState("");
  const [files, setFiles] = useState<FileEntry[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (raw: FileList | null) => {
    if (!raw) return;
    const incoming = Array.from(raw);
    const next: FileEntry[] = [...files];
    let totalBytes = files.reduce((s, f) => s + f.size, 0);
    for (const f of incoming) {
      if (next.length >= MAX_FILES) {
        toast.error(`Tối đa ${MAX_FILES} file`);
        break;
      }
      if (f.size > MAX_FILE_BYTES) {
        toast.error(`File "${f.name}" quá 10MB`);
        continue;
      }
      if (totalBytes + f.size > MAX_TOTAL_BYTES) {
        toast.error("Tổng dung lượng quá 20MB");
        break;
      }
      next.push({
        alias: aliasFromFilename(f.name),
        name: f.name,
        type: f.type || "application/octet-stream",
        blob: f,
        size: f.size,
      });
      totalBytes += f.size;
    }
    setFiles(next);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      submit();
    }
  };

  const submit = () => {
    const trimmed = text.trim();
    if (!trimmed && files.length === 0) return;
    if (disabled) return;
    onSend(trimmed, files);
    setText("");
    setFiles([]);
  };

  const removeFile = (alias: string) => setFiles((prev) => prev.filter((f) => f.alias !== alias));

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div
      className="shrink-0 border-t border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900"
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      <div className="mx-auto max-w-4xl">
        {files.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {files.map((f) => (
              <FileAttachmentChip key={f.alias} file={f} onRemove={() => removeFile(f.alias)} />
            ))}
          </div>
        )}
        <div className="flex items-end gap-2 rounded-2xl border border-zinc-300 bg-white p-2 transition-colors focus-within:border-brand dark:border-zinc-700 dark:bg-zinc-900">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || files.length >= MAX_FILES}
            title="Đính kèm file"
            className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-zinc-200 text-zinc-500 transition-colors hover:bg-zinc-50 disabled:pointer-events-none disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            <Paperclip className="size-4" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e: ChangeEvent<HTMLInputElement>) => handleFiles(e.target.files)}
          />
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Nhập câu hỏi của bạn..."
            rows={Math.min(8, Math.max(1, text.split("\n").length))}
            className="max-h-32 flex-1 py-1.5"
            disabled={disabled}
          />
          <button
            type="button"
            onClick={submit}
            disabled={disabled || (!text.trim() && files.length === 0)}
            aria-label="Gửi"
            className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand text-white transition-[background-color,transform] hover:bg-brand-hover active:translate-y-px disabled:pointer-events-none disabled:opacity-50"
          >
            <Send className="size-4" />
          </button>
        </div>
        <div className="mt-2 text-center text-[11px] text-zinc-400">
          Trợ lý có thể mắc lỗi. Hãy kiểm tra các thông tin quan trọng.
        </div>
      </div>
    </div>
  );
}
