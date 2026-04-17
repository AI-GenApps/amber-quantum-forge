import { StyleSheet, Text, View, ActivityIndicator, ScrollView } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useAuth } from "../contexts/AuthContext";
import { AuthScreen } from "../components/AuthScreen";
import { ProfilePictureEditor } from "../components/ProfilePictureEditor";
import { useState, useEffect } from "react";
import { getApiUrl } from "../firebase.config";

export default function Native() {
  const { user, loading, signOut, getIdToken } = useAuth();
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null);
  const [fetchingProfile, setFetchingProfile] = useState(false);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#2f80ed" />
        <StatusBar style="auto" />
      </View>
    );
  }

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      try {
        setFetchingProfile(true);
        const idToken = await getIdToken();
        if (!idToken) return;

        const apiUrl = getApiUrl();
        const response = await fetch(`${apiUrl}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${idToken}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setProfilePictureUrl(data.profilePictureUrl || null);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setFetchingProfile(false);
      }
    };

    fetchProfile();
  }, [user, getIdToken]);

  if (!user) {
    return (
      <View style={styles.container}>
        <AuthScreen />
        <StatusBar style="auto" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Welcome!</Text>
      <Text style={styles.subtitle}>{user.email}</Text>
      {user.displayName && <Text style={styles.subtitle}>{user.displayName}</Text>}
      
      <ProfilePictureEditor
        profilePictureUrl={profilePictureUrl}
        onUpdate={setProfilePictureUrl}
      />

      <View style={styles.buttonContainer}>
        <Text style={styles.button} onPress={signOut}>
          Sign Out
        </Text>
      </View>
      <StatusBar style="auto" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  header: {
    fontWeight: "bold",
    marginBottom: 10,
    fontSize: 36,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 8,
  },
  buttonContainer: {
    marginTop: 20,
  },
  button: {
    color: "#2f80ed",
    fontSize: 16,
    fontWeight: "600",
    padding: 10,
  },
});
