import React from "react";
import {
  Pressable,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  View,
  Platform,
} from "react-native";

interface ButtonProps {
  onPress?: () => void;
  title: string;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "ai";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  onPress,
  title,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  style,
  textStyle,
  icon,
}) => {
  const bg = {
    primary:   { bg: "#00F0FF", border: "#00F0FF", text: "#000000" },
    secondary: { bg: "#FFFFFF", border: "#FFFFFF",  text: "#000000" },
    outline:   { bg: "transparent", border: "#1F1F1F", text: "#FFFFFF" },
    ghost:     { bg: "transparent", border: "transparent", text: "#00F0FF" },
    ai:        { bg: "#8B5CF6", border: "#8B5CF6", text: "#FFFFFF" },
  }[variant];

  const pad = {
    sm:  { paddingVertical: 6,  paddingHorizontal: 12 },
    md:  { paddingVertical: 12, paddingHorizontal: 20 },
    lg:  { paddingVertical: 16, paddingHorizontal: 24 },
  }[size];

  // On web, use onClick in addition to onPress for reliability
  const webProps = Platform.OS === "web" ? { onClick: onPress } : {};

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      {...webProps}
      style={({ pressed }) => [
        styles.base,
        pad,
        {
          backgroundColor: disabled ? "#1A1A1A" : bg.bg,
          borderColor: disabled ? "#1A1A1A" : bg.border,
          opacity: pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={bg.text} size="small" />
      ) : (
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }}>
          {icon}
          {title ? (
            <Text style={[styles.text, { color: disabled ? "#444" : bg.text }, textStyle]}>
              {title}
            </Text>
          ) : null}
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 4,
    borderWidth: 1,
    // Web: ensure the button is always clickable
    ...(Platform.OS === "web" ? { cursor: "pointer" } as any : {}),
  },
  text: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
});
