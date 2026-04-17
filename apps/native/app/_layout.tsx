import { Stack } from "expo-router"
import { AuthProvider } from "../contexts/AuthContext"
import { RevenueCatProvider } from "../contexts/RevenueCatContext"
import { NotificationProvider } from "../contexts/NotificationContext"
import { UpdateProvider } from "../contexts/UpdateContext"
import { AppConfigProvider } from "../contexts/AppConfigContext"
import { UpdatePrompt } from "../components/UpdatePrompt"

const AppLayout = () => {
  return (
    <AppConfigProvider>
      <AuthProvider>
        <RevenueCatProvider>
          <NotificationProvider>
            <UpdateProvider>
              <UpdatePrompt />
              <Stack />
            </UpdateProvider>
          </NotificationProvider>
        </RevenueCatProvider>
      </AuthProvider>
    </AppConfigProvider>
  )
}

export default AppLayout
