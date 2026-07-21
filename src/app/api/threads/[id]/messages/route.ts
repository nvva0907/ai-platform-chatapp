import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAnonIdFromRequest } from "@/lib/anon-id";
import { akagentFetch, akPaths } from "@/lib/akagent";
import { parseSseLines, TurnAccumulator, TraceBuilder } from "@/lib/sse-turn-tracker";
import type { ChatSendBody, StoredFile } from "@/lib/types";

function errorResponse(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const anonId = getAnonIdFromRequest(req);
  if (!anonId) return errorResponse(401, "unauthorized", "Missing cookie");
  const thread = await prisma.thread.findUnique({ where: { id } });
  if (!thread) return errorResponse(404, "not_found", "Thread not found");
  if (thread.anonymousId !== anonId)
    return errorResponse(403, "forbidden", "Not your thread");

  const url = new URL(req.url);
  const cursor = url.searchParams.get("cursor");
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "50", 10) || 50, 200);

  const messages = await prisma.message.findMany({
    where: { threadId: id },
    orderBy: { createdAt: "asc" },
    take: limit + 1,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
  });

  const nextCursor = messages.length > limit ? messages[limit - 1].id : null;
  return NextResponse.json({
    messages: messages.slice(0, limit),
    next_cursor: nextCursor,
  });
}

const MAX_FILES = 5;
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MAX_TOTAL_BYTES = 20 * 1024 * 1024;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const anonId = getAnonIdFromRequest(req);
  if (!anonId) return errorResponse(401, "unauthorized", "Missing cookie");

  const thread = await prisma.thread.findUnique({ where: { id } });
  if (!thread) return errorResponse(404, "not_found", "Thread not found");
  if (thread.anonymousId !== anonId)
    return errorResponse(403, "forbidden", "Not your thread");

  const body = (await req.json()) as ChatSendBody;
  const files = body.files || [];

  // Validate limits
  if (files.length > MAX_FILES)
    return errorResponse(413, "payload_too_large", `Max ${MAX_FILES} files`);
  let totalBytes = 0;
  const storedFiles: StoredFile[] = [];
  for (const f of files) {
    // Approx decoded size (base64 → 3/4)
    const size = Math.floor((f.content_base64.length * 3) / 4);
    if (size > MAX_FILE_BYTES)
      return errorResponse(413, "payload_too_large", `File '${f.alias}' too large`);
    totalBytes += size;
    if (totalBytes > MAX_TOTAL_BYTES)
      return errorResponse(413, "payload_too_large", "Total exceeds 20MB");
    storedFiles.push({
      alias: f.alias,
      filename: f.filename,
      content_type: f.content_type,
      size_bytes: size,
    });
  }

  // Save user message
  await prisma.message.create({
    data: {
      threadId: thread.id,
      role: "user",
      content: body.message,
      files: storedFiles as unknown as object,
    },
  });

  // Auto-title from first user msg
  if (!thread.title && body.message.trim().length > 0) {
    await prisma.thread.update({
      where: { id: thread.id },
      data: { title: body.message.slice(0, 60) },
    });
  }

  // Call AKAgent (server-side, key hidden)
  const akRes = await akagentFetch(akPaths.chatStream(), {
    method: "POST",
    body: JSON.stringify({
      thread_id: thread.id,
      message: body.message,
      files,
    }),
  });

  if (!akRes.ok || !akRes.body) {
    const errText = await akRes.text().catch(() => "");
    return errorResponse(
      akRes.status === 429 ? 429 : 502,
      akRes.status === 429 ? "rate_limited" : "upstream_error",
      `AKAgent ${akRes.status}: ${errText.slice(0, 200)}`,
    );
  }

  // Pipe SSE back + buffer for DB save
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const reader = akRes.body.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();

  let runId: string | undefined;
  let sseBuffer = "";
  let finalAnswerAccum = "";
  const turns = new TurnAccumulator();
  const trace = new TraceBuilder();

  (async () => {
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        sseBuffer += chunk;
        await writer.write(encoder.encode(chunk));

        // Parse SSE lines — chỉ commit tokens của turn "final" (has_tool_calls
        // = false) vào nội dung lưu DB. Turn "thinking" (has_tool_calls =
        // true) bị loại bỏ khỏi content, được lưu riêng vào `trace`.
        const lines = sseBuffer.split("\n");
        sseBuffer = lines.pop() || "";
        for (const { event, data } of parseSseLines(lines)) {
          if (event === "token" && typeof data.token === "string") {
            turns.addToken(data.token);
          } else if (event === "turn_end") {
            const { kind, text } = turns.endTurn(Boolean(data.has_tool_calls));
            if (kind === "final") finalAnswerAccum += text;
            else trace.pushThinking(text);
          } else if (event === "tool_call_start") {
            trace.startTool(
              typeof data.run_id === "string" ? data.run_id : undefined,
              typeof data.tool_name === "string" ? data.tool_name : undefined,
            );
          } else if (event === "tool_call_end") {
            trace.endTool(typeof data.run_id === "string" ? data.run_id : undefined);
          } else if (event === "status" && typeof data.text === "string") {
            trace.pushStatus(data.text);
          } else if (event === "run_started" && typeof data.run_id === "string" && !runId) {
            runId = data.run_id;
          }
        }
      }
    } catch (e) {
      console.error("Stream pipe error:", e);
    } finally {
      // Trailing buffer chưa có turn_end đóng (stream kết thúc đột ngột) —
      // giữ lại thay vì mất nội dung.
      finalAnswerAccum += turns.current;
      const assistantContent = finalAnswerAccum;
      const traceEntries = trace.get();
      // Save assistant message + update thread lastMessageAt
      if (assistantContent.length > 0 || runId) {
        await prisma.message.create({
          data: {
            threadId: thread.id,
            role: "assistant",
            content: assistantContent,
            trace: traceEntries.length > 0 ? (traceEntries as unknown as object) : undefined,
            akagentRunId: runId ?? null,
          },
        });
        await prisma.thread.update({
          where: { id: thread.id },
          data: { lastMessageAt: new Date() },
        });
      }
      await writer.close().catch(() => {});
    }
  })();

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
