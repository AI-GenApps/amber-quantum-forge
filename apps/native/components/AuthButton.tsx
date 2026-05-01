import type React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";

interface AuthButtonProps {
  onPress: () => Promise<void>;
  text: string;
  loading?: boolean;
  disabled?: boolean;
}

export const AuthButton: React.FC<AuthButtonProps> = ({
  onPress,
  text,
  loading = false,
  disabled = false,
}) => {
  return (
    <Pressable
      style={[styles.button, (loading || disabled) && styles.buttonDisabled]}
      onPress={onPress}
      disabled={loading || disabled}
    >
      {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.text}>{text}</Text>}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    maxWidth: 300,
    width: "100%",
    borderRadius: 10,
    paddingTop: 14,
    paddingBottom: 14,
    paddingLeft: 30,
    paddingRight: 30,
    backgroundColor: "#2f80ed",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  text: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
