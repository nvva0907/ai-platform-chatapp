import { NextResponse } from "next/server";
import { akagentFetch, akPaths } from "@/lib/akagent";
import type { AgentMeta } from "@/lib/types";

// Module-level cache. Reset on process restart. Sufficient MVP.
let cache: { data: AgentMeta; expiresAt: number } | null = null;
const TTL_MS = 60_000;

export async function GET() {
  if (cache && Date.now() < cache.expiresAt) {
    return NextResponse.json(cache.data);
  }
  try {
    const res = await akagentFetch(akPaths.meta(), { method: "GET" });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return NextResponse.json(
        { error: { code: "upstream_error", message: `AKAgent ${res.status}: ${text}` } },
        { status: 502 },
      );
    }
    const data = (await res.json()) as AgentMeta;
    cache = { data, expiresAt: Date.now() + TTL_MS };
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json(
      { error: { code: "upstream_error", message: e instanceof Error ? e.message : "AKAgent unreachable" } },
      { status: 502 },
    );
  }
}
