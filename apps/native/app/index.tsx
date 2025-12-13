import { StyleSheet, Text, View, ActivityIndicator } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useAuth } from "../contexts/AuthContext";
import { AuthScreen } from "../components/AuthScreen";

export default function Native() {
  const { user, loading, signOut } = useAuth();

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#2f80ed" />
        <StatusBar style="auto" />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <AuthScreen />
        <StatusBar style="auto" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Welcome!</Text>
      <Text style={styles.subtitle}>{user.email}</Text>
      {user.displayName && <Text style={styles.subtitle}>{user.displayName}</Text>}
      <View style={styles.buttonContainer}>
        <Text style={styles.button} onPress={signOut}>
          Sign Out
        </Text>
      </View>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
