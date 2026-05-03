import AsyncStorage from "@react-native-async-storage/async-storage";
import crashlytics from "@react-native-firebase/crashlytics";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { MaintenanceBanner } from "../components/MaintenanceBanner";
import { UpdatePrompt } from "../components/UpdatePrompt";
import { AppConfigProvider } from "../contexts/AppConfigContext";
import { AuthProvider } from "../contexts/AuthContext";
import { NotificationProvider } from "../contexts/NotificationContext";
import { RevenueCatProvider } from "../contexts/RevenueCatContext";
import { UpdateProvider } from "../contexts/UpdateContext";

const ONBOARDING_KEY = "onboarding_seen";

const queryClient = new QueryClient();

function RootNavigator() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    crashlytics().setCrashlyticsCollectionEnabled(!__DEV__);
    AsyncStorage.getItem(ONBOARDING_KEY).then((val) => {
      setReady(true);
      if (!val) {
        router.replace("/onboarding");
      }
    });
  }, [router]);

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
