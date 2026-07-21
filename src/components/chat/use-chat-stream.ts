"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { blobToBase64 } from "@/lib/utils";
import { parseSseLines, TurnAccumulator, TraceBuilder, type TraceEntry } from "@/lib/sse-turn-tracker";

export interface FileEntry {
  alias: string;
  name: string;
  type: string;
  blob: Blob;
  size: number;
}

export type StreamStatus = "idle" | "sending" | "streaming" | "error";

export interface OptimisticUserMessage {
  content: string;
  files: FileEntry[];
}

export type { TraceEntry };

export function useChatStream(threadId: string) {
  const qc = useQueryClient();
  const [pending, setPending] = useState("");
  const [trace, setTrace] = useState<TraceEntry[]>([]);
  const [status, setStatus] = useState<StreamStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [optimisticUserMessage, setOptimisticUserMessage] = useState<OptimisticUserMessage | null>(null);

  const send = async (message: string, files: FileEntry[]) => {
    setStatus("sending");
    setPending("");
    setTrace([]);
    setError(null);
    // Hiện tin nhắn user NGAY LẬP TỨC (trước khi encode file/gọi network) —
    // trước đó phải đợi round-trip xong (encode base64 + fetch + AKAgent phản
    // hồi, ~1-2s) mới invalidate query để thấy tin nhắn, khiến loading của bot
    // hiện ra TRƯỚC cả tin nhắn của chính user.
    setOptimisticUserMessage({ content: message, files });

    const encodedFiles = await Promise.all(
      files.map(async (f) => ({
        alias: f.alias,
        filename: f.name,
        content_type: f.type,
        content_base64: await blobToBase64(f.blob),
      })),
    );

    const res = await fetch(`/api/threads/${threadId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ message, files: encodedFiles }),
    });

    if (!res.ok || !res.body) {
      const err = await res.json().catch(() => ({}));
      setStatus("error");
      setError(err.error?.message || `HTTP ${res.status}`);
      setOptimisticUserMessage(null);
      return;
    }

    setStatus("streaming");
    // Đợi query có tin nhắn user THẬT từ DB rồi mới bỏ bản optimistic — tránh
    // 1 khung hình thiếu tin nhắn giữa lúc optimistic biến mất và data thật
    // (từ refetch) chưa kịp render.
    await qc.invalidateQueries({ queryKey: ["messages", threadId] });
    setOptimisticUserMessage(null);

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    const turns = new TurnAccumulator();
    const traceBuilder = new TraceBuilder();
    // Text đã được turn_end xác nhận là final — cộng dồn qua nhiều turn nếu
    // graph có nhiều LLM node nối tiếp. `pending` = confirmed + turn hiện tại
    // (hiện optimistic, có thể bị rút lại nếu turn đó hoá ra là "thinking").
    let finalAnswerAccum = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const { event, data } of parseSseLines(lines)) {
          switch (event) {
            case "token": {
              if (typeof data.token === "string") {
                turns.addToken(data.token);
                setPending(finalAnswerAccum + turns.current);
              }
              break;
            }
            case "turn_end": {
              const { kind, text } = turns.endTurn(Boolean(data.has_tool_calls));
              if (kind === "thinking") {
                traceBuilder.pushThinking(text);
                setTrace(traceBuilder.snapshot());
              } else {
                finalAnswerAccum += text;
              }
              setPending(finalAnswerAccum);
              break;
            }
            case "tool_call_start": {
              traceBuilder.startTool(
                typeof data.run_id === "string" ? data.run_id : undefined,
                typeof data.tool_name === "string" ? data.tool_name : undefined,
              );
              setTrace(traceBuilder.snapshot());
              break;
            }
            case "tool_call_end": {
              traceBuilder.endTool(typeof data.run_id === "string" ? data.run_id : undefined);
              setTrace(traceBuilder.snapshot());
              break;
            }
            case "status": {
              if (typeof data.text === "string") {
                traceBuilder.pushStatus(data.text);
                setTrace(traceBuilder.snapshot());
              }
              break;
            }
            case "error": {
              if (data.error) setError(typeof data.error === "string" ? data.error : "Stream error");
              break;
            }
            default:
              break;
          }
        }
      }
    } catch (e: unknown) {
      setStatus("error");
      setError(e instanceof Error ? e.message : "Stream error");
      return;
    }

    // Đợi messages refetch xong TRƯỚC KHI tắt streaming state — nếu tắt ngay
    // (status="idle" → isStreaming=false), live bubble ẩn đi trong khi tin
    // nhắn thật từ DB (đã có trace) chưa kịp load, gây 1 khung hình trắng
    // nháy lên.
    await qc.invalidateQueries({ queryKey: ["messages", threadId] });

    setStatus("idle");
    setPending("");
    setTrace([]);
    qc.invalidateQueries({ queryKey: ["threads"] });
  };

  return { send, pending, trace, status, error, optimisticUserMessage };
}
