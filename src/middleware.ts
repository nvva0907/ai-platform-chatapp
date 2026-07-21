import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { CHAT_AID_COOKIE, generateCookieValue } from "@/lib/anon-id";

export function middleware(req: NextRequest) {
  const existing = req.cookies.get(CHAT_AID_COOKIE)?.value;
  const res = NextResponse.next();
  if (!existing) {
    res.cookies.set({
      name: CHAT_AID_COOKIE,
      value: generateCookieValue(),
      httpOnly: true,
      sameSite: "lax",
      secure: req.nextUrl.protocol === "https:",
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: "/",
    });
  }
  return res;
}

export const config = {
  // Chỉ chạy trên page + api routes, skip static asset.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
