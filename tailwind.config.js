/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: "#0A0A0A", // Obsidian Void
        foreground: "#FFFFFF",
        primary: {
          DEFAULT: "#00F0FF", // Electric Cyan
          foreground: "#000000",
        },
        secondary: {
          DEFAULT: "#1F1F1F", // Surface Border
          foreground: "#FFFFFF",
        },
        accent: {
          DEFAULT: "#8B5CF6", // AI Purple
          foreground: "#FFFFFF",
        },
        card: {
          DEFAULT: "#121212", // Glass Layer
          border: "#1F1F1F",
        },
        muted: {
          DEFAULT: "#1A1A1A",
          foreground: "#8E8E93",
        },
        border: "#1F1F1F",
      },
      borderRadius: {
        sm: "4px",    // Surgical Sharp
        DEFAULT: "6px",
        lg: "8px",
        xl: "12px",
      },
      fontFamily: {
        sans: ["Inter", "System"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
