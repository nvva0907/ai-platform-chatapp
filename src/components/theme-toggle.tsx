"use client";

import { useTheme } from "@/lib/use-theme";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { dark, toggle } = useTheme();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Đổi chế độ màu"
      className={cn(
        "shrink-0 rounded-lg p-1 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800",
        className,
      )}
    >
      <div
        className={cn(
          "relative h-[22px] w-10 rounded-full transition-colors duration-200",
          dark ? "bg-brand" : "bg-zinc-200 dark:bg-zinc-700",
        )}
      >
        <div
          className={cn(
            "absolute top-[3px] size-4 rounded-full bg-white shadow transition-[left] duration-200 ease-out",
            dark ? "left-[21px]" : "left-[3px]",
          )}
        />
      </div>
    </button>
  );
}
