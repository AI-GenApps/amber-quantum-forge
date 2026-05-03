export const Colors = {
  light: {
    background: "#FFFFFF",
    surface: "#F2F2F7",
    text: "#000000",
    textSecondary: "#6C6C70",
    border: "#C6C6C8",
    primary: "#007AFF",
  },
  dark: {
    background: "#000000",
    surface: "#1C1C1E",
    text: "#FFFFFF",
    textSecondary: "#8E8E93",
    border: "#38383A",
    primary: "#0A84FF",
  },
} as const;

export type ColorToken = keyof typeof Colors.light;
