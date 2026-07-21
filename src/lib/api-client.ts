// Browser-side fetch helpers hitting our own /api/* routes.
// AKAGENT_KEY is NEVER touched here — server routes hold it.

import type { ErrorEnvelope } from "@/lib/types";
import type { TraceEntry } from "@/lib/sse-turn-tracker";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    credentials: "same-origin",
  });
  if (!res.ok) {
    const errBody = (await res.json().catch(() => ({}))) as ErrorEnvelope;
    throw new Error(errBody.error?.message || `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export interface ThreadSummary {
  id: string;
  title: string | null;
  startedAt: string;
  lastMessageAt: string;
}

export interface MessageRow {
  id: string;
  threadId: string;
  role: "user" | "assistant" | "system";
  content: string;
  files: Array<{ alias: string; filename: string; content_type: string; size_bytes: number }>;
  trace: TraceEntry[] | null;
  akagentRunId: string | null;
  createdAt: string;
}

export const apiClient = {
  threads: {
    list: () => request<{ threads: ThreadSummary[] }>("/api/threads"),
    create: () => request<{ id: string }>("/api/threads", { method: "POST" }),
    update: (id: string, patch: { title?: string; archivedAt?: string | null }) =>
      request<ThreadSummary>(`/api/threads/${id}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      }),
    delete: (id: string) => request<void>(`/api/threads/${id}`, { method: "DELETE" }),
  },
  messages: {
    list: (threadId: string, cursor?: string) => {
      const q = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
      return request<{ messages: MessageRow[]; next_cursor: string | null }>(
        `/api/threads/${threadId}/messages${q}`,
      );
    },
    // send() uses fetch directly (returns Response) — see use-chat-stream.ts
  },
  agentMeta: () => request<import("./types").AgentMeta>("/api/agent-meta"),
};
