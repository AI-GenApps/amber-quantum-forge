import type { ChatOnFinishCallback, UIMessage } from "ai";

export type { UIMessage as ChatMessage } from "ai";

export interface UseAIChatOptions {
  initialMessages?: UIMessage[];
  system?: string;
  onError?: (error: Error) => void;
  onFinish?: ChatOnFinishCallback<UIMessage>;
}
