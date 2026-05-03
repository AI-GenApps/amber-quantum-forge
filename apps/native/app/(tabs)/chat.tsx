import { StyleSheet } from "react-native";
import { ThemedText, ThemedView } from "../../components/themed";

export default function ChatPlaceholder() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText variant="heading">Chat</ThemedText>
      <ThemedText variant="body" style={styles.sub}>
        Chat coming soon
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
  sub: { marginTop: 8 },
});
