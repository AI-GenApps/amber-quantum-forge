import { useChat } from "@ai-sdk/react";
import { useAuth } from "@plugin/expo-auth";
import { DefaultChatTransport } from "ai";
import { useEffect, useState } from "react";
import type { UseAIChatOptions } from "./types";

const API_BASE_URL = process.env["EXPO_PUBLIC_API_URL"] ?? "";

export function useAIChat(options: UseAIChatOptions = {}) {
  const { getAccessToken } = useAuth();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    getAccessToken().then((t) => setToken(t ?? null));
  }, [getAccessToken]);

  const transport = new DefaultChatTransport({
    api: `${API_BASE_URL}/ai/chat`,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  const chat = useChat({
    transport,
    messages: options.initialMessages,
    onError: options.onError,
    onFinish: options.onFinish,
  });

  async function syncMessages(): Promise<void> {
    const currentToken = await getAccessToken();
    if (!currentToken || chat.messages.length === 0) return;
    await fetch(`${API_BASE_URL}/chat/sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${currentToken}`,
      },
      body: JSON.stringify({
        messages: chat.messages.map((m) => ({
          clientId: m.id,
          role: m.role,
          content: m.parts
            .filter((p) => p.type === "text")
            .map((p) => (p as { type: "text"; text: string }).text)
            .join(""),
          createdAt: new Date().toISOString(),
        })),
      }),
    });
  }

  return { ...chat, syncMessages };
}
