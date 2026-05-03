import { useColorScheme } from "react-native";
import { Colors, type ColorToken } from "./tokens";

export function useThemeColor(colors: { light: string; dark: string }): string {
  const raw = useColorScheme();
  const scheme: "light" | "dark" = raw === "dark" ? "dark" : "light";
  return colors[scheme];
}

export function useToken(token: ColorToken): string {
  const raw = useColorScheme();
  const scheme: "light" | "dark" = raw === "dark" ? "dark" : "light";
  return Colors[scheme][token];
}
