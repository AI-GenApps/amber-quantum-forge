import { useChatStore } from "./useChatStore";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "";

export async function syncMessages(accessToken: string): Promise<void> {
  const { messages, markSynced } = useChatStore.getState();
  const unsynced = messages.filter((m) => !m.synced);
  if (unsynced.length === 0) return;
  const res = await fetch(`${API_BASE_URL}/chat/sync`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      messages: unsynced.map((m) => ({
        clientId: m.id,
        role: m.role,
        content: m.content,
        createdAt: m.createdAt,
      })),
    }),
  });
  if (!res.ok) throw new Error(`sync failed: ${res.status}`);
  markSynced(unsynced.map((m) => m.id));
}
