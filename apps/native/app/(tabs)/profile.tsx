import { useAuth } from "@plugin/expo-auth";
import { Pressable } from "react-native";
import { ThemedText, ThemedView, useToken } from "../../components/themed";

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const primary = useToken("primary");

  return (
    <ThemedView style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 20 }}>
      <ThemedText variant="heading" style={{ marginBottom: 16 }}>
        Profile
      </ThemedText>
      {user?.email && <ThemedText variant="body">{user.email}</ThemedText>}
      {user?.displayName && (
        <ThemedText variant="body" style={{ marginTop: 4 }}>
          {user.displayName}
        </ThemedText>
      )}
      <Pressable onPress={signOut} style={{ marginTop: 24, padding: 10 }}>
        <ThemedText variant="body" style={{ fontWeight: "600", color: primary }}>
          Sign Out
        </ThemedText>
      </Pressable>
    </ThemedView>
  );
}
