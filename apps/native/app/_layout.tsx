import { Stack } from "expo-router";
import { MaintenanceBanner } from "../components/MaintenanceBanner";
import { UpdatePrompt } from "../components/UpdatePrompt";
import { AppConfigProvider } from "../contexts/AppConfigContext";
import { AuthProvider } from "../contexts/AuthContext";
import { NotificationProvider } from "../contexts/NotificationContext";
import { RevenueCatProvider } from "../contexts/RevenueCatContext";
import { UpdateProvider } from "../contexts/UpdateContext";

const AppLayout = () => {
  return (
    <AppConfigProvider>
      <AuthProvider>
        <RevenueCatProvider>
          <NotificationProvider>
            <UpdateProvider>
              <UpdatePrompt />
              <MaintenanceBanner />
              <Stack />
            </UpdateProvider>
          </NotificationProvider>
        </RevenueCatProvider>
      </AuthProvider>
    </AppConfigProvider>
  );
};

export default AppLayout;
