import type React from "react";
import { StyleSheet, useWindowDimensions } from "react-native";
import { ThemedText, ThemedView } from "../themed";

interface Props {
  title: string;
  body: string;
  emoji: string;
}

export function OnboardingSlide({ title, body, emoji }: Props): React.ReactElement {
  const { width } = useWindowDimensions();
  return (
    <ThemedView style={[styles.slide, { width }]}>
      <ThemedText style={styles.emoji}>{emoji}</ThemedText>
      <ThemedText variant="heading" style={styles.title}>
        {title}
      </ThemedText>
      <ThemedText variant="body" style={styles.body}>
        {body}
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  slide: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  emoji: { fontSize: 64, marginBottom: 24 },
  title: { textAlign: "center", marginBottom: 12 },
  body: { textAlign: "center" },
});
