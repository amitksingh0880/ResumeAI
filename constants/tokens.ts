// Constants for design tokens, matching tailwind.config.js
export const Colors = {
  background: {
    DEFAULT: "#0D1117",
    secondary: "#161B22",
    tertiary: "#1C2128",
  },
  border: {
    DEFAULT: "#30363D",
    focus: "#58A6FF",
  },
  accent: {
    DEFAULT: "#58A6FF",
    hover: "#79B8FF",
    muted: "#1F3A5F",
  },
  success: {
    DEFAULT: "#3FB950",
    muted: "#1A3A1F",
  },
  danger: {
    DEFAULT: "#F85149",
    muted: "#3A1A1A",
  },
  warning: {
    DEFAULT: "#D29922",
    muted: "#3A2A00",
  },
  muted: {
    DEFAULT: "#8B949E",
    foreground: "#6E7681",
  },
  foreground: {
    DEFAULT: "#E6EDF3",
    secondary: "#C9D1D9",
    muted: "#8B949E",
  },
  card: {
    DEFAULT: "#161B22",
    hover: "#1C2128",
  },
  violet: {
    DEFAULT: "#A371F7",
    muted: "#2D1F4D",
  },
} as const;

export const FontFamily = {
  sans: "System",
  mono: "Courier",
  display: "System",
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  "2xl": 32,
  "3xl": 48,
} as const;

export const Radius = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  "2xl": 20,
  full: 9999,
} as const;
