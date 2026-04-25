export const Theme = {
  dark: {
    background: "#000000",
    card: "#1D2226",
    surface: "#293138",
    accent: "#0A66C2",
    accentMuted: "rgba(10, 102, 194, 0.2)",
    textPrimary: "#FFFFFF",
    textSecondary: "#A8B4BF",
    textMuted: "#666666",
    border: "#2F3C48",
    danger: "#D92D20",
    success: "#057642",
    warning: "#F59E0B",
    glow: "rgba(10, 102, 194, 0.4)",
  },
  light: {
    background: "#F3F2EF",
    card: "#FFFFFF",
    surface: "#EEF3F8",
    accent: "#0A66C2",
    accentMuted: "rgba(10, 102, 194, 0.1)",
    textPrimary: "#000000",
    textSecondary: "#666666",
    textMuted: "#8E8E93",
    border: "#DDE1E3",
    danger: "#D92D20",
    success: "#057642",
    warning: "#F59E0B",
    glow: "rgba(10, 102, 194, 0.2)",
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
