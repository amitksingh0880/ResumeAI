export const Theme = {
  dark: {
    background: "#050206",
    card: "#0D0B0E",
    surface: "#1A181B",
    accent: "#9A8174",
    accentMuted: "rgba(154, 129, 116, 0.15)",
    textPrimary: "#F2F0F1",
    textSecondary: "#A19EA1",
    textMuted: "#6B696B",
    border: "#252326",
    danger: "#FF3B30",
    success: "#34C759",
    warning: "#FFD60A",
    glow: "rgba(154, 129, 116, 0.4)",
  },
  light: {
    background: "#FFFFFF",
    card: "#F8F7F8",
    surface: "#F0EFEF",
    accent: "#9A8174",
    accentMuted: "rgba(154, 129, 116, 0.1)",
    textPrimary: "#1A181B",
    textSecondary: "#6B696B",
    textMuted: "#A19EA1",
    border: "#EAE8EA",
    danger: "#FF3B30",
    success: "#34C759",
    warning: "#FF9500",
    glow: "rgba(154, 129, 116, 0.2)",
  },
  radius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  }
};

export type AppTheme = typeof Theme.dark;
