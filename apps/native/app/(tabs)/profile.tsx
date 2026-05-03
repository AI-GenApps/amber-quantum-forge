import { useAuth } from "@plugin/expo-auth";
import { StyleSheet } from "react-native";
import { ThemedText, ThemedView, useToken } from "../../components/themed";

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const primary = useToken("primary");

  return (
    <ThemedView style={styles.container}>
      <ThemedText variant="heading" style={styles.title}>
        Profile
      </ThemedText>
      {user?.email && <ThemedText variant="body">{user.email}</ThemedText>}
      {user?.displayName && (
        <ThemedText variant="body" style={styles.name}>
          {user.displayName}
        </ThemedText>
      )}
      <ThemedText variant="body" style={[styles.signOut, { color: primary }]} onPress={signOut}>
        Sign Out
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 20 },
  title: { marginBottom: 16 },
  name: { marginTop: 4 },
  signOut: { marginTop: 24, fontWeight: "600", padding: 10 },
});
