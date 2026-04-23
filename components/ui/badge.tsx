import React from "react";
import { View, Text, StyleSheet, ViewStyle, TextStyle } from "react-native";

interface BadgeProps {
  label: string;
  variant?: "primary" | "secondary" | "ai" | "outline";
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Badge: React.FC<BadgeProps> = ({ label, variant = "outline", style, textStyle }) => {
  const getVariantStyles = () => {
    switch (variant) {
      case "primary": return { backgroundColor: "#00F0FF", color: "#000000" };
      case "secondary": return { backgroundColor: "#1F1F1F", color: "#FFFFFF" };
      case "ai": return { backgroundColor: "#8B5CF6", color: "#FFFFFF" };
      case "outline": return { backgroundColor: "transparent", borderColor: "#1F1F1F", borderWidth: 1, color: "#FFFFFF" };
      default: return { backgroundColor: "transparent", borderColor: "#1F1F1F", borderWidth: 1, color: "#FFFFFF" };
    }
  };

  const vStyles = getVariantStyles();

  return (
    <View style={[
      styles.base, 
      { 
        backgroundColor: vStyles.backgroundColor, 
        borderColor: vStyles.borderColor || "transparent", 
        borderWidth: vStyles.borderWidth || 0 
      }, 
      style
    ]}>
      <Text style={[styles.text, { color: vStyles.color }, textStyle]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: "flex-start",
  },
  text: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
});
