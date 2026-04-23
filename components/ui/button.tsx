import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
  TextStyle,
  Platform,
} from "react-native";

interface ButtonProps {
  onPress?: () => void;
  title: string;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
}

export const Button: React.FC<ButtonProps> = ({
  onPress,
  title,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  icon,
  style,
}) => {
  const isWeb = Platform.OS === "web";

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      disabled={disabled || loading}
      style={[
        styles.base,
        styles[variant],
        styles[size],
        disabled && styles.disabled,
        style,
        // @ts-ignore - Web-only property
        isWeb && { cursor: disabled || loading ? "default" : "pointer" },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === "primary" ? "#000" : "#00F0FF"} size="small" />
      ) : (
        <View style={styles.content}>
          {icon && <View style={styles.iconContainer}>{icon}</View>}
          <Text
            style={[
              styles.textBase,
              styles[`${variant}Text` as keyof typeof styles] as TextStyle,
              styles[`${size}Text` as keyof typeof styles] as TextStyle,
              disabled && styles.disabledText,
            ]}
          >
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  iconContainer: {
    marginRight: 8,
  },
  // Variants
  primary: {
    backgroundColor: "#00F0FF",
  },
  secondary: {
    backgroundColor: "#1A1A1A",
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  outline: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#1F1F1F",
  },
  ghost: {
    backgroundColor: "transparent",
  },
  danger: {
    backgroundColor: "#FF3B30",
  },
  disabled: {
    opacity: 0.5,
  },
  // Sizes
  sm: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  md: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  lg: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  // Text Styles
  textBase: {
    fontWeight: "900",
    letterSpacing: 1,
    textAlign: "center",
  },
  primaryText: {
    color: "#000000",
  },
  secondaryText: {
    color: "#FFFFFF",
  },
  outlineText: {
    color: "#00F0FF",
  },
  ghostText: {
    color: "#8E8E93",
  },
  dangerText: {
    color: "#FFFFFF",
  },
  disabledText: {
    color: "#444",
  },
  smText: {
    fontSize: 10,
  },
  mdText: {
    fontSize: 12,
  },
  lgText: {
    fontSize: 14,
  },
});
