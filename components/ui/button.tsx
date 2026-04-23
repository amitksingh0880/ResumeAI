import React from "react";
import { Pressable, Text, ActivityIndicator, StyleSheet, ViewStyle, TextStyle, View } from "react-native";

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
  const getVariantStyles = () => {
    switch (variant) {
      case "primary":
        return { backgroundColor: "#00F0FF", borderColor: "#00F0FF" };
      case "secondary":
        return { backgroundColor: "#FFFFFF", borderColor: "#FFFFFF" };
      case "outline":
        return { backgroundColor: "transparent", borderColor: "#1F1F1F", borderWidth: 1 };
      case "ghost":
        return { backgroundColor: "transparent", borderColor: "transparent" };
      case "ai":
        return { backgroundColor: "#8B5CF6", borderColor: "#8B5CF6" };
      default:
        return { backgroundColor: "#00F0FF", borderColor: "#00F0FF" };
    }
  };

  const getTextColor = () => {
    if (disabled) return "#444444";
    switch (variant) {
      case "primary": return "#000000";
      case "secondary": return "#000000";
      case "outline": return "#FFFFFF";
      case "ghost": return "#00F0FF";
      case "ai": return "#FFFFFF";
      default: return "#000000";
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case "sm": return { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 4 };
      case "md": return { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 4 };
      case "lg": return { paddingVertical: 16, paddingHorizontal: 24, borderRadius: 4 };
      default: return { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 4 };
    }
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        getVariantStyles(),
        getSizeStyles(),
        pressed && { opacity: 0.9 },
        disabled && { backgroundColor: "#1A1A1A", borderColor: "#1A1A1A" },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          {icon && <View style={{ marginRight: 8 }}>{icon}</View>}
          <Text style={[styles.text, { color: getTextColor() }, textStyle]}>
            {title.toUpperCase()}
          </Text>
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  text: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1,
    fontFamily: "Inter", // Or JetBrains Mono if available
  },
});
