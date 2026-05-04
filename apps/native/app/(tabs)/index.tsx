import { useAuth } from "@plugin/expo-auth";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView } from "react-native";
import { AuthScreen } from "../../components/AuthScreen";
import { ProfilePictureEditor } from "../../components/ProfilePictureEditor";
import { ThemedText, ThemedView, useToken } from "../../components/themed";
import { getApiUrl } from "../../firebase.config";

export default function Native() {
  const { user, loading, signOut, getAccessToken } = useAuth();
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null);
  const primary = useToken("primary");

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      try {
        const idToken = await getAccessToken();
        if (!idToken) return;
        const apiUrl = getApiUrl();
        const response = await fetch(`${apiUrl}/auth/me`, {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        if (response.ok) {
          const data = await response.json();
          setProfilePictureUrl((data as { profilePictureUrl?: string }).profilePictureUrl ?? null);
        }
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      }
    };
    fetchProfile();
  }, [user, getAccessToken]);

  if (loading) {
    return (
      <ThemedView style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 20 }}>
        <ActivityIndicator size="large" color={primary} />
        <StatusBar style="auto" />
      </ThemedView>
    );
  }

  if (!user) {
    return (
      <ThemedView style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 20 }}>
        <AuthScreen />
        <StatusBar style="auto" />
      </ThemedView>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={{
        flexGrow: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <ThemedText variant="heading" style={{ marginBottom: 10 }}>
        Welcome!
      </ThemedText>
      <ThemedText variant="body" style={{ marginBottom: 8 }}>
        {user.email}
      </ThemedText>
      {user.displayName && (
        <ThemedText variant="body" style={{ marginBottom: 8 }}>
          {user.displayName}
        </ThemedText>
      )}
      <ProfilePictureEditor profilePictureUrl={profilePictureUrl} onUpdate={setProfilePictureUrl} />
      <ThemedView style={{ marginTop: 20 }}>
        <Pressable onPress={signOut} style={{ padding: 10 }}>
          <ThemedText variant="body" style={{ fontSize: 16, fontWeight: "600", color: primary }}>
            Sign Out
          </ThemedText>
        </Pressable>
      </ThemedView>
      <StatusBar style="auto" />
    </ScrollView>
  );
}
