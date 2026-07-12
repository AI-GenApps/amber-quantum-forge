import { Linking, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAppConfig } from "../contexts/AppConfigContext";
import { getAppVersion } from "../services/appMetadata";

// Fallback URLs used only when admin hasn't configured them.
const FALLBACK_STORE_URL = Platform.select({
  ios: "https://apps.apple.com/app/idYOUR_APP_ID",
  android: "https://play.google.com/store/apps/details?id=app.w3dev.starter",
  default: "",
});

export function UpdatePrompt() {
  const { updateStatus, dismissUpdate, appMetadata } = useAppConfig();
  const currentVersion = getAppVersion();
  const versionConfig = appMetadata?.versionConfig;
  const latestVersion = versionConfig?.latestVersion || "";
  const configuredStore = Platform.select({
    ios: appMetadata?.storeUrls?.ios,
    android: appMetadata?.storeUrls?.android,
    default: "",
  });
  const storeUrl = configuredStore || FALLBACK_STORE_URL || "";

  const openStore = () => {
    if (storeUrl) Linking.openURL(storeUrl);
  };

  if (updateStatus === "update_required") {
    const body =
      versionConfig?.forceUpdateMessage ||
      `You are running v${currentVersion}. Version ${latestVersion} is required to continue using this app.`;
    return (
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Update Required</Text>
          <Text style={styles.body}>{body}</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={openStore}>
            <Text style={styles.primaryButtonText}>Update Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (updateStatus === "update_available") {
    const body =
      versionConfig?.optionalUpdateMessage ||
      `Version ${latestVersion} is available (you have v${currentVersion})`;
    return (
      <View style={styles.banner}>
        <Text style={styles.bannerText}>{body}</Text>
        <View style={styles.bannerActions}>
          <TouchableOpacity onPress={openStore}>
            <Text style={styles.updateLink}>Update</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={dismissUpdate}>
            <Text style={styles.dismissLink}>Later</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
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
    marginBottom: 24,
    lineHeight: 20,
  },
  primaryButton: {
    backgroundColor: "#2f80ed",
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  banner: {
    backgroundColor: "#EBF5FF",
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  bannerText: {
    fontSize: 13,
    color: "#333",
    flex: 1,
  },
  bannerActions: {
    flexDirection: "row",
    gap: 12,
    marginLeft: 8,
  },
  updateLink: {
    color: "#2f80ed",
    fontWeight: "600",
    fontSize: 13,
  },
  dismissLink: {
    color: "#888",
    fontSize: 13,
  },
});
