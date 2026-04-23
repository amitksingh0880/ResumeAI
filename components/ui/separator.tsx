import { cn } from "@/lib/utils";
import React from "react";
import { View } from "react-native";

export function Separator({
  className,
  orientation = "horizontal",
}: {
  className?: string;
  orientation?: "horizontal" | "vertical";
}) {
  return (
    <View
      className={cn(
        "bg-border-DEFAULT",
        orientation === "horizontal" ? "h-px w-full" : "w-px h-full",
        className
      )}
    />
  );
}
