import { Image } from "expo-image";
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
          tabBarIcon: ({ color, size }) => (
            <Image source="sf:house.fill" style={{ width: size, height: size, tintColor: color }} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "Chat",
          tabBarIcon: ({ color, size }) => (
            <Image
              source="sf:bubble.left.fill"
              style={{ width: size, height: size, tintColor: color }}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Image
              source="sf:person.fill"
              style={{ width: size, height: size, tintColor: color }}
            />
          ),
        }}
      />
    </Tabs>
  );
}
