import React from "react";
import { Text as RNText, type TextProps as RNTextProps, StyleSheet } from "react-native";

type Variant = "default" | "h1" | "h2" | "h3" | "h4" | "lead" | "body" | "muted" | "small" | "code" | "label";

export interface TextProps extends RNTextProps {
  variant?: Variant;
}

const variantStyles: Record<Variant, object> = {
  default: { fontSize: 16, color: "#FFFFFF" },
  h1: { fontSize: 32, fontWeight: "900", color: "#FFFFFF" },
  h2: { fontSize: 24, fontWeight: "800", color: "#FFFFFF" },
  h3: { fontSize: 20, fontWeight: "700", color: "#FFFFFF" },
  h4: { fontSize: 18, fontWeight: "600", color: "#FFFFFF" },
  lead: { fontSize: 16, color: "#8E8E93" },
  body: { fontSize: 14, color: "#FFFFFF" },
  muted: { fontSize: 14, color: "#8E8E93" },
  small: { fontSize: 12, color: "#8E8E93" },
  code: { fontSize: 13, color: "#00F0FF" },
  label: { fontSize: 11, fontWeight: "700", color: "#8E8E93", letterSpacing: 1, textTransform: "uppercase" },
};

export function Text({ variant = "default", style, ...props }: TextProps) {
  return (
    <RNText
      style={[variantStyles[variant], style]}
      {...props}
    />
  );
}
