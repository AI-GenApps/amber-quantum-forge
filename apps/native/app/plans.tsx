import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Purchases, { type PurchasesPackage } from "react-native-purchases";
import { useAuth } from "../contexts/AuthContext";
import { useRevenueCat } from "../contexts/RevenueCatContext";

export default function PlansScreen() {
  const router = useRouter();
  useAuth();
  const {
    packages,
    customerInfo,
    loading,
    error,
    isSubscribed,
    activeEntitlements,
    fetchOfferings,
    purchasePackage,
    restorePurchases,
    refreshCustomerInfo,
    showManageSubscriptions,
  } = useRevenueCat();

  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    fetchOfferings();
  }, [fetchOfferings]);

  const handlePurchase = async (pkg: PurchasesPackage) => {
    setPurchasing(true);
    try {
      const newCustomerInfo = await purchasePackage(pkg);

      const hasActiveEntitlement = Object.keys(newCustomerInfo.entitlements.active).length > 0;

      if (hasActiveEntitlement) {
        Alert.alert("Success!", "Your subscription is now active. Thank you for subscribing!", [
          { text: "OK" },
        ]);
        await refreshCustomerInfo();
      }
    } catch (err: any) {
      if (err.userCancelled) {
        console.log("User cancelled purchase");
      } else if (err.code === Purchases.PURCHASES_ERROR_CODE.PRODUCT_ALREADY_PURCHASED_ERROR) {
        Alert.alert("Already Subscribed", "You already have an active subscription.");
        await refreshCustomerInfo();
      } else {
        Alert.alert("Purchase Error", err.message || "Failed to complete purchase");
      }
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    try {
      const restoredCustomerInfo = await restorePurchases();
      const hasActiveEntitlement = Object.keys(restoredCustomerInfo.entitlements.active).length > 0;

      if (hasActiveEntitlement) {
        Alert.alert("Restored!", "Your subscription has been restored successfully.", [
          { text: "OK" },
        ]);
        await refreshCustomerInfo();
      } else {
        Alert.alert("No Subscription Found", "No active subscription found to restore.");
      }
    } catch (err: any) {
      Alert.alert("Restore Error", err.message || "Failed to restore purchases");
    } finally {
      setRestoring(false);
    }
  };

  const handleManageSubscriptions = async () => {
    try {
      if (Platform.OS === "ios") {
        await showManageSubscriptions();
      } else {
        Alert.alert(
          "Manage Subscriptions",
          "Please manage your subscription through the Google Play Store.",
        );
      }
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to open subscription management");
    }
  };

  const renderPackageItem = ({ item }: { item: PurchasesPackage }) => {
    const { product } = item;
    const isCurrentPlan = customerInfo
      ? customerInfo.allPurchasedProductIdentifiers.includes(product.identifier) ||
        Object.values(customerInfo.entitlements.active).some(
          (entitlement) => entitlement.productIdentifier === product.identifier,
        )
      : false;
    const isPurchasing = purchasing;

    return (
      <Pressable
        style={[
          styles.packageItem,
          isCurrentPlan && styles.currentPackageItem,
          (isPurchasing || restoring) && styles.disabledPackageItem,
        ]}
        onPress={() => handlePurchase(item)}
        disabled={isPurchasing || restoring || isCurrentPlan}
      >
        <View style={styles.packageContent}>
          <View style={styles.packageHeader}>
            <Text style={styles.packageTitle}>{product.title}</Text>
            {isCurrentPlan && (
              <View style={styles.currentBadge}>
                <Text style={styles.currentBadgeText}>Current</Text>
              </View>
            )}
          </View>
          {product.description && (
            <Text style={styles.packageDescription}>{product.description}</Text>
          )}
          {product.introPrice && (
            <Text style={styles.introPricing}>
              {product.introPrice.priceString} for {product.introPrice.period}
            </Text>
          )}
        </View>
        <View style={styles.packagePriceContainer}>
          <Text style={styles.packagePrice}>{product.priceString}</Text>
          {isCurrentPlan && <Text style={styles.currentPlanText}>Active</Text>}
        </View>
      </Pressable>
    );
  };

  const renderCurrentSubscription = () => {
    if (!customerInfo || !isSubscribed) {
      return null;
    }

    const activeEntitlement = Object.values(customerInfo.entitlements.active)[0];
    if (!activeEntitlement?.expirationDate) {
      return null;
    }

    const expirationDate = new Date(activeEntitlement.expirationDate);
    const isExpired = expirationDate < new Date();

    return (
      <View style={styles.currentSubscriptionContainer}>
        <Text style={styles.sectionTitle}>Current Subscription</Text>
        <View style={styles.subscriptionCard}>
          <View style={styles.subscriptionHeader}>
            <Text style={styles.subscriptionTitle}>{activeEntitlement.productIdentifier}</Text>
            <View style={[styles.statusBadge, isExpired && styles.expiredBadge]}>
              <Text style={styles.statusBadgeText}>{isExpired ? "Expired" : "Active"}</Text>
            </View>
          </View>
          <Text style={styles.subscriptionDetail}>
            Expires: {expirationDate.toLocaleDateString()}
          </Text>
          <Text style={styles.subscriptionDetail}>
            Will Renew: {activeEntitlement.willRenew ? "Yes" : "No"}
          </Text>
          {activeEntitlements.length > 0 && (
            <Text style={styles.subscriptionDetail}>
              Entitlements: {activeEntitlements.join(", ")}
            </Text>
          )}
        </View>
      </View>
    );
  };

  if (loading && !customerInfo) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2f80ed" />
        <Text style={styles.loadingText}>Loading plans...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>✕</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Subscription Plans</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable onPress={fetchOfferings} style={styles.retryButton}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </Pressable>
          </View>
        )}

        {renderCurrentSubscription()}

        <View style={styles.availablePlansContainer}>
          <Text style={styles.sectionTitle}>Available Plans</Text>
          {packages.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No subscription plans available</Text>
            </View>
          ) : (
            <FlatList
              data={packages}
              renderItem={renderPackageItem}
              keyExtractor={(item) => item.identifier}
              scrollEnabled={false}
              contentContainerStyle={styles.packagesList}
            />
          )}
        </View>

        <View style={styles.actionsContainer}>
          <Pressable
            onPress={handleRestore}
            disabled={restoring || purchasing}
            style={[styles.actionButton, (restoring || purchasing) && styles.disabledButton]}
          >
            {restoring ? (
              <ActivityIndicator size="small" color="#2f80ed" />
            ) : (
              <Text style={styles.actionButtonText}>Restore Purchases</Text>
            )}
          </Pressable>

          {isSubscribed && (
            <Pressable onPress={handleManageSubscriptions} style={styles.actionButton}>
              <Text style={styles.actionButtonText}>Manage Subscription</Text>
            </Pressable>
          )}
        </View>

        <Text style={styles.termsText}>
          By subscribing, you agree to our Terms and Conditions. Subscriptions will auto-renew
          unless cancelled.
        </Text>
      </ScrollView>

      {(purchasing || restoring) && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.overlayText}>
            {purchasing ? "Processing purchase..." : "Restoring purchases..."}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
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
  closeButton: {
    position: "absolute",
    left: 20,
    top: 60,
    padding: 8,
  },
  closeButtonText: {
    fontSize: 24,
    color: "#333",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  errorContainer: {
    backgroundColor: "#fee",
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: "center",
  },
  errorText: {
    color: "#c00",
    marginBottom: 12,
    textAlign: "center",
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#2f80ed",
    borderRadius: 6,
  },
  retryButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  currentSubscriptionContainer: {
    marginBottom: 32,
  },
  subscriptionCard: {
    backgroundColor: "#f5f5f5",
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
  },
  subscriptionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  subscriptionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
  },
  statusBadge: {
    backgroundColor: "#4caf50",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  expiredBadge: {
    backgroundColor: "#f44336",
  },
  statusBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  subscriptionDetail: {
    fontSize: 14,
    color: "#666",
    marginTop: 8,
  },
  availablePlansContainer: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  packagesList: {
    gap: 12,
  },
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
  currentPackageItem: {
    borderColor: "#4caf50",
    backgroundColor: "#f1f8f4",
  },
  disabledPackageItem: {
    opacity: 0.6,
  },
  packageContent: {
    flex: 1,
    marginRight: 12,
  },
  packageHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  packageTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
  },
  currentBadge: {
    backgroundColor: "#4caf50",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  currentBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
  },
  packageDescription: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  introPricing: {
    fontSize: 12,
    color: "#4caf50",
    marginTop: 4,
    fontWeight: "600",
  },
  packagePriceContainer: {
    alignItems: "flex-end",
  },
  packagePrice: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  currentPlanText: {
    fontSize: 12,
    color: "#4caf50",
    marginTop: 4,
    fontWeight: "600",
  },
  emptyContainer: {
    padding: 32,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
  },
  actionsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    padding: 16,
    backgroundColor: "#2f80ed",
    borderRadius: 12,
    alignItems: "center",
  },
  disabledButton: {
    opacity: 0.6,
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  termsText: {
    fontSize: 12,
    color: "#999",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 20,
  },
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
  overlayText: {
    color: "#fff",
    marginTop: 16,
    fontSize: 16,
  },
});
