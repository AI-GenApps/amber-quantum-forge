import { StyleSheet, Text, View } from "react-native";
import { useAppConfig } from "../contexts/AppConfigContext";

export function MaintenanceBanner() {
  const { appMetadata } = useAppConfig();
  const maintenance = appMetadata?.maintenanceMode;

  if (!maintenance?.enabled) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.modal}>
        <Text style={styles.title}>We'll be right back</Text>
        <Text style={styles.body}>{maintenance.message || "The app is under maintenance."}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10000,
  },
  modal: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 28,
    marginHorizontal: 32,
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
  },
  body: {
    fontSize: 14,
    color: "#555",
    textAlign: "center",
    lineHeight: 20,
  },
});
