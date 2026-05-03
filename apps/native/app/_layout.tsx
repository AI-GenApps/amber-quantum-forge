import crashlytics from "@react-native-firebase/crashlytics";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { useEffect } from "react";
import { MaintenanceBanner } from "../components/MaintenanceBanner";
import { UpdatePrompt } from "../components/UpdatePrompt";
import { AppConfigProvider } from "../contexts/AppConfigContext";
import { AuthProvider } from "../contexts/AuthContext";
import { NotificationProvider } from "../contexts/NotificationContext";
import { RevenueCatProvider } from "../contexts/RevenueCatContext";
import { UpdateProvider } from "../contexts/UpdateContext";

const queryClient = new QueryClient();

const AppLayout = () => {
  useEffect(() => {
    crashlytics().setCrashlyticsCollectionEnabled(!__DEV__);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AppConfigProvider>
        <AuthProvider>
          <RevenueCatProvider>
            <NotificationProvider>
              <UpdateProvider>
                <UpdatePrompt />
                <MaintenanceBanner />
                <Stack>
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                  <Stack.Screen name="plans" />
                </Stack>
              </UpdateProvider>
            </NotificationProvider>
          </RevenueCatProvider>
        </AuthProvider>
      </AppConfigProvider>
    </QueryClientProvider>
  );
};

export default AppLayout;
