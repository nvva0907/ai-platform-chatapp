"use client";

import { useChatStream } from "./use-chat-stream";
import { MessageList } from "./message-list";
import { Composer } from "./composer";
import { ArtifactProvider } from "./artifact-context";
import { ArtifactPanel } from "./artifact-panel";

interface Props {
  threadId: string;
}

export function ChatPanel({ threadId }: Props) {
  const { send, pending, trace, status, error, optimisticUserMessage } = useChatStream(threadId);
  const isBusy = status === "sending" || status === "streaming";

  return (
    <ArtifactProvider>
      <div className="flex flex-1 min-w-0 min-h-0">
        <div className="flex flex-1 flex-col min-w-0 min-h-0">
          <MessageList
            threadId={threadId}
            streamingContent={pending}
            trace={trace}
            isStreaming={isBusy}
            optimisticUserMessage={optimisticUserMessage}
            onPickSuggestion={(prompt) => send(prompt, [])}
          />
          {error && (
            <div className="border-t border-red-200 bg-red-50 px-4 py-2 text-xs text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
              Lỗi: {error}
            </div>
          )}
          <Composer disabled={isBusy} onSend={send} />
        </div>
        <ArtifactPanel />
      </div>
    </ArtifactProvider>
  );
}
