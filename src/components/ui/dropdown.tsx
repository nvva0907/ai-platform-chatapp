"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Props {
  trigger: ReactNode;
  children: ReactNode;
  align?: "left" | "right";
}

export function Dropdown({ trigger, children, align = "right" }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler, true);
    return () => document.removeEventListener("mousedown", handler, true);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <div onClick={() => setOpen((v) => !v)}>{trigger}</div>
      {open && (
        <div
          className={cn(
            "absolute top-full mt-1 z-50 min-w-40 rounded-xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900 p-1",
            align === "right" ? "right-0" : "left-0",
          )}
          style={{ animation: "popIn 0.15s ease both" }}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export function DropdownItem({
  onClick,
  className,
  children,
  destructive,
}: {
  onClick?: () => void;
  className?: string;
  children: ReactNode;
  destructive?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800",
        destructive && "text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20",
        className,
      )}
    >
      {children}
    </button>
  );
}
