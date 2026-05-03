import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { LocalChatMessage } from "./types";

const MAX_MESSAGES = 200;
const STORAGE_KEY = "@chat/messages";

interface ChatStoreState {
  messages: LocalChatMessage[];
  addMessage: (message: LocalChatMessage) => void;
  updateLastMessage: (content: string) => void;
  markSynced: (ids: string[]) => void;
}

export const useChatStore = create<ChatStoreState>()(
  persist(
    (set) => ({
      messages: [],
      addMessage: (message) =>
        set((state) => {
          const next = [...state.messages, message];
          return {
            messages: next.length > MAX_MESSAGES ? next.slice(next.length - MAX_MESSAGES) : next,
          };
        }),
      updateLastMessage: (content) =>
        set((state) => {
          if (state.messages.length === 0) return state;
          const messages = [...state.messages];
          messages[messages.length - 1] = { ...messages[messages.length - 1], content };
          return { messages };
        }),
      markSynced: (ids) =>
        set((state) => ({
          messages: state.messages.map((m) => (ids.includes(m.id) ? { ...m, synced: true } : m)),
        })),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
