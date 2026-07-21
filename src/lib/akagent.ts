// Server-side ONLY. Never import from client components.
import "server-only";

const HOST = process.env.AKAGENT_HOST;
const KEY = process.env.AKAGENT_KEY;
const AGENT_ID = process.env.AKAGENT_AGENT_ID;

if (!HOST || !KEY || !AGENT_ID) {
  throw new Error(
    "Missing AKAgent env vars. Set AKAGENT_HOST, AKAGENT_KEY, AKAGENT_AGENT_ID in .env.local",
  );
}

/** Wrapper adding Bearer + JSON headers. Never expose KEY. */
export async function akagentFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const url = `${HOST}${path}`;
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${KEY}`);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  return fetch(url, { ...init, headers });
}

export const AKAGENT_AGENT_ID = AGENT_ID;

// Path helpers
export const akPaths = {
  meta: () => `/api/v1/public/agents/${AGENT_ID}`,
  chatStream: () => `/api/v1/public/chat/${AGENT_ID}/stream`,
};
