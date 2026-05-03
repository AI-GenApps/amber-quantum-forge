import type React from "react";
import { View, type ViewProps } from "react-native";
import { useToken } from "./useThemeColor";

export function ThemedView({ style, ...props }: ViewProps): React.ReactElement {
  const backgroundColor = useToken("background");
  return <View style={[{ backgroundColor }, style]} {...props} />;
}
