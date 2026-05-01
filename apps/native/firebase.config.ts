import Constants from "expo-constants";

const getEnvVar = (key: string, extraKey?: string): string | undefined => {
  if (extraKey && Constants.expoConfig?.extra?.[extraKey]) {
    return Constants.expoConfig.extra[extraKey] as string;
  }
  if (typeof process !== "undefined" && process.env) {
    return process.env[key];
  }
  return undefined;
};

export const getApiUrl = (): string => {
  const apiUrl = getEnvVar("EXPO_PUBLIC_API_URL", "apiUrl");
  return apiUrl || "http://localhost:3000";
};

export const getRevenueCatApiKey = (): string | undefined => {
  return getEnvVar("EXPO_PUBLIC_REVENUECAT_API_KEY", "revenueCatApiKey");
};
