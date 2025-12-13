import { Stack } from "expo-router"
import { AuthProvider } from "../contexts/AuthContext"

const AppLayout = () => {
  return (
    <AuthProvider>
      <Stack />
    </AuthProvider>
  )
}

export default AppLayout
