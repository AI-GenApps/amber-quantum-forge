export type ChatRole = "user" | "assistant" | "system";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface StreamOptions {
  model?: string;
  system?: string;
  temperature?: number;
  maxTokens?: number;
}
