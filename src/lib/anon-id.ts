import { createHash } from "crypto";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "chat_aid";

/**
 * Generate a 64-hex-char random cookie value using Web Crypto API.
 * Uses globalThis.crypto.getRandomValues() instead of Node's randomBytes()
 * so this function works in BOTH Edge and Node runtimes (Next.js 15
 * middleware.ts runs on Edge by default, which does not support
 * Node's `crypto` module for random generation).
 */
export function generateCookieValue(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * SHA-256 hash of the raw cookie value → anonymousId.
 * Uses Node's `crypto` (createHash), only called from Route Handlers /
 * Server Components which run on the Node runtime by default.
 */
export function hashCookie(cookieValue: string): string {
  return createHash("sha256").update(cookieValue).digest("hex");
}

/** Derive anonymousId từ NextRequest cookies. Return null nếu cookie missing. */
export function getAnonIdFromRequest(req: NextRequest): string | null {
  const c = req.cookies.get(COOKIE_NAME)?.value;
  return c ? hashCookie(c) : null;
}

/** Derive anonymousId trong Server Component / Route Handler (async cookies). */
export async function getAnonId(): Promise<string | null> {
  const c = (await cookies()).get(COOKIE_NAME)?.value;
  return c ? hashCookie(c) : null;
}

export const CHAT_AID_COOKIE = COOKIE_NAME;
