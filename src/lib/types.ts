// Shared types — mirror AKAgent public API + local domain types.

export interface AgentMeta {
  id: string;
  name: string;
  welcome_message: string | null;
  placeholder: string | null;
  supports_files: boolean;
  max_file_size_bytes: number;
  max_files_per_request: number;
}

export interface ChatFile {
  alias: string;
  filename: string;
  content_type: string;
  content_base64: string;
}

export interface ChatSendBody {
  thread_id: string;
  message: string;
  files: ChatFile[];
}

/** Simple JSON error envelope matching AKAgent public API contract. */
export interface ErrorEnvelope {
  error: { code: string; message: string };
}

/** File attachment stored on Message.files JSON column (post-decode meta). */
export interface StoredFile {
  alias: string;
  filename: string;
  content_type: string;
  size_bytes: number;
}
