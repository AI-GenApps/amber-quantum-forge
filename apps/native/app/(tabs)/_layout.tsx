import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useToken } from "../../components/themed";

export default function TabsLayout() {
  const primary = useToken("primary");
  const textSecondary = useToken("textSecondary");

  return (
    <Tabs
      screenOptions={{ tabBarActiveTintColor: primary, tabBarInactiveTintColor: textSecondary }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "Chat",
          tabBarIcon: ({ color, size }) => <Ionicons name="chatbubble" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
