import { useEffect, useState } from "react";
import { Theme, type AppTheme } from "@/constants/Theme";
import { getSettings } from "@/services/storageService";

export function useTheme(): AppTheme {
  const [appearance, setAppearance] = useState<"dark" | "light">("dark");

  useEffect(() => {
    // Initial load
    getSettings().then(s => setAppearance(s.appearance));

    // Listen for changes (we can use a simple event emitter or just rely on focus effects in screens)
    // For simplicity in this project, we'll check settings often or use focus effects.
    // However, to keep it reactive across the app, we'll use a interval or just re-load on focus.
  }, []);

  return Theme[appearance];
}
