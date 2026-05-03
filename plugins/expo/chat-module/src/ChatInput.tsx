import type React from "react";
import { useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps): React.ReactElement {
  const [text, setText] = useState("");

  function handleSend(): void {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText("");
  }

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={text}
        onChangeText={setText}
        placeholder="Message..."
        placeholderTextColor="#8E8E93"
        multiline
        editable={!disabled}
        onSubmitEditing={handleSend}
        returnKeyType="send"
      />
      <TouchableOpacity
        style={[styles.sendButton, disabled && styles.sendButtonDisabled]}
        onPress={handleSend}
        disabled={disabled}
      >
        <Text style={[styles.sendText, disabled && styles.sendTextDisabled]}>Send</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#C6C6C8",
    backgroundColor: "#FFFFFF",
  },
  input: {
    flex: 1,
    minHeight: 36,
    maxHeight: 120,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#C6C6C8",
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 16,
    color: "#000000",
    backgroundColor: "#F2F2F7",
  },
  sendButton: { marginLeft: 8, paddingHorizontal: 14, paddingVertical: 8 },
  sendButtonDisabled: { opacity: 0.4 },
  sendText: { color: "#007AFF", fontSize: 16, fontWeight: "600" },
  sendTextDisabled: { color: "#8E8E93" },
});
