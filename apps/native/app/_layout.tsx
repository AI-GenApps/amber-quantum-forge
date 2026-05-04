import { AuthProvider, useAuth } from "@plugin/expo-auth";
import { syncMessages } from "@plugin/expo-chat-module";
import crashlytics from "@react-native-firebase/crashlytics";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import { ActivityIndicator, AppState, View } from "react-native";
import { MaintenanceBanner } from "../components/MaintenanceBanner";
import { UpdatePrompt } from "../components/UpdatePrompt";
import { AppConfigProvider } from "../contexts/AppConfigContext";
import { NotificationProvider } from "../contexts/NotificationContext";
import { RevenueCatProvider } from "../contexts/RevenueCatContext";
import { UpdateProvider } from "../contexts/UpdateContext";

const ONBOARDING_KEY = "onboarding_seen";

const queryClient = new QueryClient();

function RootNavigator() {
  const router = useRouter();
  const { getAccessToken } = useAuth();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    crashlytics().setCrashlyticsCollectionEnabled(!__DEV__);
    SecureStore.getItemAsync(ONBOARDING_KEY).then((val) => {
      setReady(true);
      if (!val) {
        router.replace("/onboarding");
      }
    });
  }, [router]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        getAccessToken().then((token) => {
          if (token) syncMessages(token);
        });
      }
    });
    return () => sub.remove();
  }, [getAccessToken]);

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <>
      <UpdatePrompt />
      <MaintenanceBanner />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="plans" />
      </Stack>
    </>
  );
}

const AppLayout = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AppConfigProvider>
        <AuthProvider>
          <RevenueCatProvider>
            <NotificationProvider>
              <UpdateProvider>
                <RootNavigator />
              </UpdateProvider>
            </NotificationProvider>
          </RevenueCatProvider>
        </AuthProvider>
      </AppConfigProvider>
    </QueryClientProvider>
  );
};

export default AppLayout;
