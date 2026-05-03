import type React from "react";
import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import type { LocalChatMessage } from "./types";

interface MessageBubbleProps {
  message: LocalChatMessage;
  isStreaming?: boolean;
}

export function MessageBubble({
  message,
  isStreaming = false,
}: MessageBubbleProps): React.ReactElement {
  const isUser = message.role === "user";
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!isStreaming) return;
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0, duration: 500, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [isStreaming, opacity]);

  return (
    <View style={[styles.container, isUser ? styles.userContainer : styles.assistantContainer]}>
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
        <Text style={[styles.text, isUser ? styles.userText : styles.assistantText]}>
          {message.content}
        </Text>
        {isStreaming && <Animated.Text style={[styles.cursor, { opacity }]}>|</Animated.Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginVertical: 4, marginHorizontal: 12 },
  userContainer: { alignItems: "flex-end" },
  assistantContainer: { alignItems: "flex-start" },
  bubble: {
    maxWidth: "80%",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
  },
  userBubble: { backgroundColor: "#007AFF" },
  assistantBubble: { backgroundColor: "#F2F2F7" },
  text: { fontSize: 16, lineHeight: 22 },
  userText: { color: "#FFFFFF" },
  assistantText: { color: "#000000" },
  cursor: { fontSize: 16, color: "#8E8E93", marginLeft: 2 },
});
