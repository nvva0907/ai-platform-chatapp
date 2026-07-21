import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          "w-full h-11 px-3.5 rounded-xl border border-zinc-300 bg-white text-sm",
          "focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent",
          "dark:border-zinc-700 dark:bg-zinc-900",
          "disabled:opacity-50",
          className,
        )}
        {...props}
      />
    );
  },
);

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        className={cn(
          "w-full bg-transparent text-sm resize-none",
          "focus:outline-none",
          className,
        )}
        {...props}
      />
    );
  },
);
