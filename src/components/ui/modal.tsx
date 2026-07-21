"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg";
}

const SIZES = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
};

export function Modal({ open, onClose, title, children, size = "md" }: Props) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 bg-black/45 dark:bg-black/55 z-50 flex items-center justify-center p-4"
      style={{ animation: "fadeIn 0.2s ease both" }}
      onClick={onClose}
    >
      <div
        className={cn(
          "w-full bg-white rounded-2xl shadow-xl dark:bg-zinc-900",
          SIZES[size],
        )}
        style={{ animation: "popIn 0.22s ease both" }}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="h-12 border-b border-zinc-200 dark:border-zinc-700 flex items-center px-4">
            <div className="font-semibold text-sm">{title}</div>
            <button
              type="button"
              onClick={onClose}
              className="ml-auto p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <X className="size-4" />
            </button>
          </div>
        )}
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
