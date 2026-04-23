import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: "glass" | "outline" | "solid";
  padding?: number;
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  style, 
  variant = "glass",
  padding = 24 
}) => {
  return (
    <View style={[
      styles.base, 
      styles[variant], 
      { padding },
      style
    ]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: 8,
    overflow: "hidden",
  },
  glass: {
    backgroundColor: "rgba(18, 18, 18, 0.8)", // Obsidian Glass
    borderWidth: 1,
    borderColor: "#1F1F1F",
  },
  outline: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#1F1F1F",
  },
  solid: {
    backgroundColor: "#121212",
  }
});
