import React from "react";
import { View, ViewStyle } from "react-native";

export function Separator({
  orientation = "horizontal",
  style,
}: {
  orientation?: "horizontal" | "vertical";
  style?: ViewStyle;
}) {
  return (
    <View
      style={[
        { backgroundColor: "#1F1F1F" },
        orientation === "horizontal" ? { height: 1, width: "100%" } : { width: 1, height: "100%" },
        style,
      ]}
    />
  );
}
