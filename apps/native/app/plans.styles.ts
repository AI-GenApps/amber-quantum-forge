import type { TextStyle, ViewStyle } from "react-native";

type Styles = {
  container: ViewStyle;
  loadingContainer: ViewStyle;
  loadingText: TextStyle;
  header: ViewStyle;
  closeButton: ViewStyle;
  closeButtonText: TextStyle;
  headerTitle: TextStyle;
  content: ViewStyle;
  contentContainer: ViewStyle;
  errorContainer: ViewStyle;
  errorText: TextStyle;
  retryButton: ViewStyle;
  retryButtonText: TextStyle;
  currentSubscriptionContainer: ViewStyle;
  subscriptionCard: ViewStyle;
  subscriptionHeader: ViewStyle;
  subscriptionTitle: TextStyle;
  statusBadge: ViewStyle;
  expiredBadge: ViewStyle;
  statusBadgeText: TextStyle;
  subscriptionDetail: TextStyle;
  availablePlansContainer: ViewStyle;
  sectionTitle: TextStyle;
  packagesList: ViewStyle;
  packageItem: ViewStyle;
  currentPackageItem: ViewStyle;
  disabledPackageItem: ViewStyle;
  packageContent: ViewStyle;
  packageHeader: ViewStyle;
  packageTitle: TextStyle;
  currentBadge: ViewStyle;
  currentBadgeText: TextStyle;
  packageDescription: TextStyle;
  introPricing: TextStyle;
  packagePriceContainer: ViewStyle;
  packagePrice: TextStyle;
  currentPlanText: TextStyle;
  emptyContainer: ViewStyle;
  emptyText: TextStyle;
  actionsContainer: ViewStyle;
  actionButton: ViewStyle;
  disabledButton: ViewStyle;
  actionButtonText: TextStyle;
  termsText: TextStyle;
  overlay: ViewStyle;
  overlayText: TextStyle;
};

export const styles: Styles = {
  container: { flex: 1, backgroundColor: "#fff" },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingText: { marginTop: 16, fontSize: 16, color: "#666" },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  closeButton: { position: "absolute", left: 20, top: 60, padding: 8 },
  closeButtonText: { fontSize: 24, color: "#333" },
  headerTitle: { fontSize: 24, fontWeight: "bold", color: "#333" },
  content: { flex: 1 },
  contentContainer: { padding: 20 },
  errorContainer: {
    backgroundColor: "#fee",
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: "center",
  },
  errorText: { color: "#c00", marginBottom: 12, textAlign: "center" },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#2f80ed",
    borderRadius: 6,
  },
  retryButtonText: { color: "#fff", fontWeight: "600" },
  currentSubscriptionContainer: { marginBottom: 32 },
  subscriptionCard: { backgroundColor: "#f5f5f5", padding: 16, borderRadius: 12, marginTop: 12 },
  subscriptionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  subscriptionTitle: { fontSize: 18, fontWeight: "bold", color: "#333", flex: 1 },
  statusBadge: {
    backgroundColor: "#4caf50",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  expiredBadge: { backgroundColor: "#f44336" },
  statusBadgeText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  subscriptionDetail: { fontSize: 14, color: "#666", marginTop: 8 },
  availablePlansContainer: { marginBottom: 32 },
  sectionTitle: { fontSize: 20, fontWeight: "bold", color: "#333", marginBottom: 16 },
  packagesList: { gap: 12 },
  packageItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#e0e0e0",
  },
  currentPackageItem: { borderColor: "#4caf50", backgroundColor: "#f1f8f4" },
  disabledPackageItem: { opacity: 0.6 },
  packageContent: { flex: 1, marginRight: 12 },
  packageHeader: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  packageTitle: { fontSize: 18, fontWeight: "bold", color: "#333", flex: 1 },
  currentBadge: {
    backgroundColor: "#4caf50",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  currentBadgeText: { color: "#fff", fontSize: 10, fontWeight: "600" },
  packageDescription: { fontSize: 14, color: "#666", marginTop: 4 },
  introPricing: { fontSize: 12, color: "#4caf50", marginTop: 4, fontWeight: "600" },
  packagePriceContainer: { alignItems: "flex-end" },
  packagePrice: { fontSize: 20, fontWeight: "bold", color: "#333" },
  currentPlanText: { fontSize: 12, color: "#4caf50", marginTop: 4, fontWeight: "600" },
  emptyContainer: { padding: 32, alignItems: "center" },
  emptyText: { fontSize: 16, color: "#999" },
  actionsContainer: { gap: 12, marginBottom: 24 },
  actionButton: { padding: 16, backgroundColor: "#2f80ed", borderRadius: 12, alignItems: "center" },
  disabledButton: { opacity: 0.6 },
  actionButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  termsText: { fontSize: 12, color: "#999", textAlign: "center", lineHeight: 18, marginBottom: 20 },
  overlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  overlayText: { color: "#fff", marginTop: 16, fontSize: 16 },
};
