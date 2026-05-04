import { useAuth } from "@plugin/expo-auth";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from "react-native";
import Purchases, { type PurchasesPackage } from "react-native-purchases";
import { useRevenueCat } from "../contexts/RevenueCatContext";
import { styles } from "./plans.styles";

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
    } catch (err: unknown) {
      const e = err as { userCancelled?: boolean; code?: string; message?: string };
      if (e.userCancelled) {
        console.log("User cancelled purchase");
      } else if (e.code === Purchases.PURCHASES_ERROR_CODE.PRODUCT_ALREADY_PURCHASED_ERROR) {
        Alert.alert("Already Subscribed", "You already have an active subscription.");
        await refreshCustomerInfo();
      } else {
        Alert.alert("Purchase Error", e.message ?? "Failed to complete purchase");
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
    } catch (err: unknown) {
      Alert.alert(
        "Restore Error",
        err instanceof Error ? err.message : "Failed to restore purchases",
      );
    } finally {
      setRestoring(false);
    }
  };

  const handleManageSubscriptions = async () => {
    try {
      if (process.env.EXPO_OS === "ios") {
        await showManageSubscriptions();
      } else {
        Alert.alert(
          "Manage Subscriptions",
          "Please manage your subscription through the Google Play Store.",
        );
      }
    } catch (err: unknown) {
      Alert.alert(
        "Error",
        err instanceof Error ? err.message : "Failed to open subscription management",
      );
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
            <View style={styles.packagesList}>
              {packages.map((item) => (
                <View key={item.identifier}>{renderPackageItem({ item })}</View>
              ))}
            </View>
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
