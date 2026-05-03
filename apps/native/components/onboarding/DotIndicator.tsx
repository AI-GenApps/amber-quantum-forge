import type React from "react";
import { StyleSheet, View } from "react-native";
import { useToken } from "../themed";

interface Props {
  labels: ReadonlyArray<string>;
  activeIndex: number;
}

export function DotIndicator({ labels, activeIndex }: Props): React.ReactElement {
  const primary = useToken("primary");
  const border = useToken("border");

  return (
    <View style={styles.row}>
      {labels.map((label, i) => (
        <View
          key={label}
          style={[styles.dot, { backgroundColor: i === activeIndex ? primary : border }]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "center", gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
