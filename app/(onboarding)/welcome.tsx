import { router } from "expo-router";
import { useEffect, useRef } from "react";
import {
  Animated,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
  Platform
} from "react-native";
import { LucideUpload, LucideFileText, LucideZap } from "lucide-react-native";
import { Theme } from "@/constants/Theme";

export default function WelcomeScreen() {
  const theme = Theme.dark; // Welcome screen usually looks best in dark mode
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <Animated.ScrollView
        contentContainerStyle={{ padding: 32, paddingBottom: 60, flexGrow: 1, justifyContent: "center" }}
        style={{ opacity: fadeAnim }}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo mark */}
        <Animated.View style={{ alignItems: "center", marginBottom: 60, transform: [{ translateY: slideAnim }] }}>
          <View style={{
            width: 96, height: 96, borderRadius: 24, backgroundColor: theme.card,
            borderWidth: 1, borderColor: theme.border,
            alignItems: "center", justifyContent: "center", marginBottom: 28,
            shadowColor: theme.accent, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20
          }}>
            <LucideZap color={theme.accent} size={48} />
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <View style={{ width: 20, height: 2, backgroundColor: theme.accent, borderRadius: 1 }} />
            <Text style={{ color: theme.accent, fontSize: 10, fontWeight: "900", letterSpacing: 3, textTransform: "uppercase" }}>Studio Intelligent</Text>
          </View>
          <Text style={{ fontSize: 44, fontWeight: "900", color: theme.textPrimary, letterSpacing: -1.5 }}>ResumeAI</Text>
          <Text style={{ fontSize: 14, color: theme.textSecondary, marginTop: 12, fontWeight: "600", textAlign: "center", maxWidth: "80%" }}>
            Crafting high-performance career assets with neural precision.
          </Text>
        </Animated.View>

        {/* PRIMARY — Actions */}
        <Animated.View style={{ transform: [{ translateY: slideAnim }] }}>
          <TouchableOpacity
            onPress={() => router.push("/(onboarding)/import")}
            activeOpacity={0.85}
            style={{
              backgroundColor: theme.accent,
              borderRadius: 16, paddingVertical: 20,
              alignItems: "center", flexDirection: "row",
              justifyContent: "center", gap: 12, marginBottom: 16,
              shadowColor: theme.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10
            }}
          >
            <LucideUpload color="#000" size={20} />
            <Text style={{ color: "#000", fontWeight: "900", fontSize: 15, letterSpacing: 0.5 }}>
              IMPORT REPOSITORY
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push({ pathname: "/(onboarding)/import", params: { defaultMode: "blank" } })}
            activeOpacity={0.7}
            style={{
              backgroundColor: "transparent", borderRadius: 16, borderWidth: 1,
              borderColor: theme.border, paddingVertical: 20,
              alignItems: "center", flexDirection: "row",
              justifyContent: "center", gap: 12, marginBottom: 48,
            }}
          >
            <LucideFileText color={theme.textSecondary} size={20} />
            <Text style={{ color: theme.textSecondary, fontWeight: "800", fontSize: 15, letterSpacing: 0.5 }}>
              INITIALIZE BLANK
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Feature Highlights */}
        <View style={{ gap: 16, paddingHorizontal: 10 }}>
          {[
            { color: theme.accent, label: "AI-driven conversion from legacy PDF/DOCX to editable source." },
            { color: theme.success, label: "Dynamic skill injection with automated section optimization." },
            { color: theme.warning, label: "Instant versioning and multi-template rendering engine." },
          ].map((f, i) => (
            <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 16, backgroundColor: theme.card, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: theme.border }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: f.color }} />
              <Text style={{ color: theme.textSecondary, fontSize: 12, lineHeight: 18, fontWeight: "600", flex: 1 }}>{f.label}</Text>
            </View>
          ))}
        </View>

      </Animated.ScrollView>
    </SafeAreaView>
  );
}
