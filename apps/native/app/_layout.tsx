import { Stack } from "expo-router"
import { AuthProvider } from "../contexts/AuthContext"
import { RevenueCatProvider } from "../contexts/RevenueCatContext"
import { NotificationProvider } from "../contexts/NotificationContext"
import { UpdateProvider } from "../contexts/UpdateContext"

const AppLayout = () => {
  return (
    <AuthProvider>
      <RevenueCatProvider>
        <NotificationProvider>
          <UpdateProvider>
            <Stack />
          </UpdateProvider>
        </NotificationProvider>
      </RevenueCatProvider>
    </AuthProvider>
  )
}

export default AppLayout
