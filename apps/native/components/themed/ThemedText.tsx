import type React from "react";
import { StyleSheet, Text, type TextProps } from "react-native";
import { useToken } from "./useThemeColor";

interface ThemedTextProps extends TextProps {
  variant?: "body" | "heading" | "caption";
  selectable?: boolean;
}

export function ThemedText({
  variant = "body",
  style,
  selectable = false,
  ...props
}: ThemedTextProps): React.ReactElement {
  const color = useToken("text");
  return <Text selectable={selectable} style={[styles[variant], { color }, style]} {...props} />;
}

const styles = StyleSheet.create({
  body: { fontSize: 16, lineHeight: 22 },
  heading: { fontSize: 28, fontWeight: "700", lineHeight: 34 },
  caption: { fontSize: 12, lineHeight: 16 },
});
