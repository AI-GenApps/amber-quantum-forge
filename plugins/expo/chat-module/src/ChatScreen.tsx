import { useAIChat } from "@plugin/expo-ai";
import type React from "react";
import { useCallback, useEffect, useRef } from "react";
import { AppState, FlatList, KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";
import { ChatInput } from "./ChatInput";
import { MessageBubble } from "./MessageBubble";
import { startSyncScheduler } from "./syncScheduler";
import type { LocalChatMessage } from "./types";
import { useChatStore } from "./useChatStore";

export function ChatScreen(): React.ReactElement {
  const { messages: aiMessages, sendMessage, status, syncMessages } = useAIChat();
  const { messages, addMessage, updateLastMessage, markSynced } = useChatStore();
  const flatListRef = useRef<FlatList<LocalChatMessage>>(null);

  useEffect(() => {
    for (const m of aiMessages) {
      const role = m.role === "user" ? "user" : "assistant";
      const content = m.parts
        .filter((p) => p.type === "text")
        .map((p) => (p as { type: "text"; text: string }).text)
        .join("");
      const existing = messages.find((local) => local.id === m.id);
      if (!existing) {
        addMessage({ id: m.id, role, content, createdAt: new Date().toISOString(), synced: false });
      } else if (existing.content !== content) {
        updateLastMessage(content);
      }
    }
  }, [aiMessages, messages, addMessage, updateLastMessage]);

  useEffect(() => {
    const cleanup = startSyncScheduler(async () => {
      const unsynced = messages.filter((m) => !m.synced);
      if (unsynced.length === 0) return;
      await syncMessages();
      markSynced(unsynced.map((m) => m.id));
    });
    return cleanup;
  }, [messages, syncMessages, markSynced]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        const unsynced = messages.filter((m) => !m.synced);
        if (unsynced.length === 0) return;
        syncMessages()
          .then(() => markSynced(unsynced.map((m) => m.id)))
          .catch(() => undefined);
      }
    });
    return () => subscription.remove();
  }, [messages, syncMessages, markSynced]);

  const handleSend = useCallback(
    (text: string) => {
      sendMessage({ text });
    },
    [sendMessage],
  );

  const isStreaming = status === "streaming";

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <FlatList
        ref={flatListRef}
        data={[...messages].reverse()}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <MessageBubble
            message={item}
            isStreaming={isStreaming && index === 0 && item.role === "assistant"}
          />
        )}
        inverted
        contentContainerStyle={styles.list}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToOffset({ offset: 0, animated: true })
        }
      />
      <View style={styles.inputWrapper}>
        <ChatInput onSend={handleSend} disabled={isStreaming} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  list: { paddingTop: 12 },
  inputWrapper: {},
});
