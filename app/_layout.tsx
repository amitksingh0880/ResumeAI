import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { View } from "react-native";


export default function RootLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: "#0A0A0A" }}>
      <StatusBar style="light" backgroundColor="#0A0A0A" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#0A0A0A" },
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(onboarding)/welcome" />
        <Stack.Screen name="(onboarding)/import" />
        <Stack.Screen name="(onboarding)/template-picker" />
        <Stack.Screen name="(main)/dashboard" />
        <Stack.Screen name="(main)/editor" />
        <Stack.Screen name="(main)/versions" />
        <Stack.Screen name="(main)/match" />
        <Stack.Screen name="(main)/skills" />
        <Stack.Screen name="(main)/roadmap" />
        <Stack.Screen name="(main)/settings" />
        <Stack.Screen
          name="(modals)/add-skill"
          options={{ presentation: "modal", animation: "slide_from_bottom" }}
        />

        <Stack.Screen
          name="(modals)/template-switcher"
          options={{ presentation: "modal", animation: "slide_from_bottom" }}
        />
      </Stack>
    </View>
  );
}
