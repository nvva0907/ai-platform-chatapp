/**
 * Shared SSE parsing + turn-classification + trace-building logic — dùng cả
 * server (proxy route lưu DB) lẫn client (hiển thị live). Không dùng API
 * riêng của Node/browser nên import được ở cả 2 môi trường.
 *
 * AKAgent's stream event pattern:
 *   event: token       data: {token}
 *   event: turn_end    data: {iteration, has_tool_calls}
 *   event: tool_call_start / tool_call_end   data: {tool_name, run_id, args?}
 *   event: status      data: {text}
 *   event: run_started / final / error / done  data: {...}
 *
 * "token" events accumulate per turn. Khi turn_end đến với has_tool_calls=true,
 * turn đó là "thinking" (model đang suy luận trước khi gọi tool) — KHÔNG phải
 * câu trả lời cuối. has_tool_calls=false → turn đó là final answer segment.
 */

export interface ParsedSseEvent {
  event: string | null;
  data: Record<string, unknown>;
}

/** Parse SSE wire-format lines thành (event, data) pairs. `event:` áp dụng
 * cho `data:` NGAY SAU nó (chuẩn SSE), reset lại sau mỗi data line. */
export function parseSseLines(lines: string[]): ParsedSseEvent[] {
  const events: ParsedSseEvent[] = [];
  let currentEvent: string | null = null;
  for (const line of lines) {
    if (line.startsWith("event:")) {
      currentEvent = line.slice(6).trim();
    } else if (line.startsWith("data:")) {
      try {
        const data = JSON.parse(line.slice(5).trim());
        events.push({ event: currentEvent, data });
      } catch {
        // ignore non-JSON data lines
      }
      currentEvent = null;
    }
  }
  return events;
}

export type TurnKind = "thinking" | "final";

/** Buffer tokens của 1 turn cho tới khi turn_end xác nhận turn đó là
 * "thinking" (có tool call) hay "final" (câu trả lời thật). */
export class TurnAccumulator {
  private buffer = "";

  addToken(token: string): void {
    this.buffer += token;
  }

  /** Đóng turn hiện tại, trả về nội dung + phân loại, reset buffer cho turn kế. */
  endTurn(hasToolCalls: boolean): { kind: TurnKind; text: string } {
    const text = this.buffer;
    this.buffer = "";
    return { kind: hasToolCalls ? "thinking" : "final", text };
  }

  /** Buffer đang tích luỹ, CHƯA được turn_end xác nhận — dùng cho live UI. */
  get current(): string {
    return this.buffer;
  }
}

export type TraceEntry =
  | { id: string; type: "thinking"; text: string }
  | { id: string; type: "tool"; toolName: string; status: "running" | "done" }
  | { id: string; type: "status"; text: string };

/** Gom thinking/tool-call/status thành mảng TraceEntry — dùng chung server
 * (persist DB) và client (hiển thị live), đảm bảo 2 nơi build ra cùng 1 shape. */
export class TraceBuilder {
  private entries: TraceEntry[] = [];
  private toolSeq = 0;

  pushThinking(text: string): void {
    if (!text.trim()) return;
    this.entries.push({ id: `think-${this.entries.length}`, type: "thinking", text });
  }

  startTool(runId: string | undefined, toolName: string | undefined): void {
    const id = runId || `tool-${this.toolSeq++}`;
    this.entries.push({ id, type: "tool", toolName: toolName || "công cụ", status: "running" });
  }

  endTool(runId: string | undefined): void {
    if (!runId) return;
    const idx = this.entries.findIndex((e) => e.type === "tool" && e.id === runId);
    if (idx >= 0) {
      const entry = this.entries[idx];
      if (entry.type === "tool") {
        this.entries[idx] = { ...entry, status: "done" };
      }
    }
  }

  pushStatus(text: string): void {
    if (!text.trim()) return;
    this.entries.push({ id: `status-${this.entries.length}`, type: "status", text });
  }

  /** Snapshot mới (immutable copy) — dùng để feed vào React setState. */
  snapshot(): TraceEntry[] {
    return [...this.entries];
  }

  get(): TraceEntry[] {
    return this.entries;
  }
}
