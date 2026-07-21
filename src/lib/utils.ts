import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Format ISO date to short Vietnamese relative (e.g., "5 phút trước"). */
export function formatRelative(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  const diffSec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diffSec < 60) return "vừa xong";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} phút trước`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} giờ trước`;
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)} ngày trước`;
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/** Convert File/Blob to base64 (browser-side). */
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip data URL prefix "data:...;base64,"
      const comma = result.indexOf(",");
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

/** Generate alias from filename: strip extension + sanitize. */
export function aliasFromFilename(filename: string): string {
  const base = filename.split("/").pop() || filename;
  const noExt = base.replace(/\.[^.]+$/, "");
  return noExt.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 40) || "file";
}
