import Constants from "expo-constants";
import Purchases, {
  type CustomerInfo,
  type PurchasesOfferings,
  type PurchasesPackage,
} from "react-native-purchases";

const getEnvVar = (key: string, extraKey?: string): string | undefined => {
  if (extraKey && Constants.expoConfig?.extra?.[extraKey]) {
    return Constants.expoConfig.extra[extraKey] as string;
  }
  if (typeof process !== "undefined" && process.env) {
    return process.env[key];
  }
  return undefined;
};

const getRevenueCatApiKey = (): string => {
  const apiKey = getEnvVar("EXPO_PUBLIC_REVENUECAT_API_KEY", "revenueCatApiKey");
  if (!apiKey) {
    throw new Error(
      "RevenueCat API key is missing. Please set EXPO_PUBLIC_REVENUECAT_API_KEY environment variable.",
    );
  }
  return apiKey;
};

export const initializeRevenueCat = async (): Promise<void> => {
  try {
    const alreadyConfigured = await Purchases.isConfigured();
    if (alreadyConfigured) {
      console.log("RevenueCat SDK already configured");
      return;
    }

    const apiKey = getRevenueCatApiKey();

    Purchases.setLogLevel(Purchases.LOG_LEVEL.INFO);

    await Purchases.configure({
      apiKey,
      appUserID: null,
      useAmazon: false,
      storeKitVersion:
        process.env.EXPO_OS === "ios" ? Purchases.STOREKIT_VERSION.STOREKIT_2 : undefined,
      entitlementVerificationMode: Purchases.ENTITLEMENT_VERIFICATION_MODE.DISABLED,
      diagnosticsEnabled: false,
      automaticDeviceIdentifierCollectionEnabled: true,
    });

    console.log("RevenueCat SDK initialized successfully");
  } catch (error) {
    console.error("Error initializing RevenueCat:", error);
    throw error;
  }
};

export const setRevenueCatUserId = async (userId: string): Promise<CustomerInfo> => {
  try {
    const { customerInfo, created } = await Purchases.logIn(userId);
    if (created) {
      console.log("New RevenueCat user created");
    } else {
      console.log("Existing RevenueCat user logged in");
    }
    return customerInfo;
  } catch (error) {
    console.error("Error setting RevenueCat user ID:", error);
    throw error;
  }
};

export const logoutRevenueCat = async (): Promise<CustomerInfo> => {
  try {
    const customerInfo = await Purchases.logOut();
    console.log("RevenueCat user logged out");
    return customerInfo;
  } catch (error) {
    console.error("Error logging out RevenueCat user:", error);
    throw error;
  }
};

export const getOfferings = async (): Promise<PurchasesOfferings> => {
  try {
    return await Purchases.getOfferings();
  } catch (error) {
    console.error("Error fetching offerings:", error);
    throw error;
  }
};

export const purchasePackage = async (
  pkg: PurchasesPackage,
): Promise<{ customerInfo: CustomerInfo; productIdentifier: string }> => {
  try {
    return await Purchases.purchasePackage(pkg);
  } catch (error) {
    console.error("Error purchasing package:", error);
    throw error;
  }
};

export const getCustomerInfo = async (): Promise<CustomerInfo> => {
  try {
    return await Purchases.getCustomerInfo();
  } catch (error) {
    console.error("Error fetching customer info:", error);
    throw error;
  }
};

export const restorePurchases = async (): Promise<CustomerInfo> => {
  try {
    return await Purchases.restorePurchases();
  } catch (error) {
    console.error("Error restoring purchases:", error);
    throw error;
  }
};

export const showManageSubscriptions = async (): Promise<void> => {
  try {
    if (process.env.EXPO_OS === "ios") {
      await Purchases.showManageSubscriptions();
    } else {
      throw new Error("Manage subscriptions is only available on iOS");
    }
  } catch (error) {
    console.error("Error showing manage subscriptions:", error);
    throw error;
  }
};

export const isRevenueCatConfigured = async (): Promise<boolean> => {
  try {
    return await Purchases.isConfigured();
  } catch (error) {
    console.error("Error checking RevenueCat configuration:", error);
    return false;
  }
};
