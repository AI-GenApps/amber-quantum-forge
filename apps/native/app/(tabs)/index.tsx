import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet } from "react-native";
import { AuthScreen } from "../../components/AuthScreen";
import { ProfilePictureEditor } from "../../components/ProfilePictureEditor";
import { ThemedText, ThemedView, useToken } from "../../components/themed";
import { useAuth } from "../../contexts/AuthContext";
import { getApiUrl } from "../../firebase.config";

export default function Native() {
  const { user, loading, signOut, getIdToken } = useAuth();
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null);
  const primary = useToken("primary");

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      try {
        const idToken = await getIdToken();
        if (!idToken) return;
        const apiUrl = getApiUrl();
        const response = await fetch(`${apiUrl}/auth/me`, {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        if (response.ok) {
          const data = await response.json();
          setProfilePictureUrl((data as { profilePictureUrl?: string }).profilePictureUrl ?? null);
        }
      } catch {
        // ignore
      }
    };
    fetchProfile();
  }, [user, getIdToken]);

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" color={primary} />
        <StatusBar style="auto" />
      </ThemedView>
    );
  }

  if (!user) {
    return (
      <ThemedView style={styles.container}>
        <AuthScreen />
        <StatusBar style="auto" />
      </ThemedView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ThemedText variant="heading" style={styles.header}>
        Welcome!
      </ThemedText>
      <ThemedText variant="body" style={styles.subtitle}>
        {user.email}
      </ThemedText>
      {user.displayName && (
        <ThemedText variant="body" style={styles.subtitle}>
          {user.displayName}
        </ThemedText>
      )}
      <ProfilePictureEditor profilePictureUrl={profilePictureUrl} onUpdate={setProfilePictureUrl} />
      <ThemedView style={styles.buttonContainer}>
        <ThemedText variant="body" style={[styles.button, { color: primary }]} onPress={signOut}>
          Sign Out
        </ThemedText>
      </ThemedView>
      <StatusBar style="auto" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, alignItems: "center", justifyContent: "center", padding: 20 },
  header: { marginBottom: 10 },
  subtitle: { marginBottom: 8 },
  buttonContainer: { marginTop: 20 },
  button: { fontSize: 16, fontWeight: "600", padding: 10 },
});
