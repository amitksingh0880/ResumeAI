import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import React from "react";
import { Text as RNText, type TextProps as RNTextProps } from "react-native";

const textVariants = cva("text-foreground-DEFAULT", {
  variants: {
    variant: {
      default: "text-foreground-DEFAULT",
      h1: "text-3xl font-bold text-foreground-DEFAULT",
      h2: "text-2xl font-bold text-foreground-DEFAULT",
      h3: "text-xl font-semibold text-foreground-DEFAULT",
      h4: "text-lg font-semibold text-foreground-DEFAULT",
      lead: "text-base text-foreground-secondary",
      body: "text-sm text-foreground-DEFAULT",
      muted: "text-sm text-muted-DEFAULT",
      small: "text-xs text-muted-DEFAULT",
      code: "text-sm font-mono text-accent-DEFAULT",
      label: "text-xs font-semibold uppercase tracking-wider text-muted-DEFAULT",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export interface TextProps
  extends RNTextProps,
    VariantProps<typeof textVariants> {
  className?: string;
}

export function Text({ variant, className, ...props }: TextProps) {
  return (
    <RNText
      className={cn(textVariants({ variant }), className)}
      {...props}
    />
  );
}
