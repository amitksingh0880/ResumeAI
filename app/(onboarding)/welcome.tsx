import { router } from "expo-router";
import { useEffect, useRef } from "react";
import {
  Animated,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LucideUpload, LucideFileText, LucideZap } from "lucide-react-native";

export default function WelcomeScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0A0A0A" }}>
      <Animated.ScrollView
        contentContainerStyle={{ padding: 28, paddingBottom: 56 }}
        style={{ opacity: fadeAnim }}
      >
        {/* Logo mark */}
        <Animated.View style={{ alignItems: "center", marginTop: 52, marginBottom: 48, transform: [{ translateY: slideAnim }] }}>
          <View style={{
            width: 80, height: 80, borderRadius: 8, backgroundColor: "#121212",
            borderWidth: 1, borderColor: "#00F0FF",
            alignItems: "center", justifyContent: "center", marginBottom: 20,
          }}>
            <LucideZap color="#00F0FF" size={40} />
          </View>
          <Text style={{ color: "#00F0FF", fontSize: 10, fontWeight: "900", letterSpacing: 3, marginBottom: 8 }}>OBSIDIAN PRO</Text>
          <Text style={{ fontSize: 36, fontWeight: "900", color: "#FFFFFF", letterSpacing: -1 }}>ResumeAI</Text>
          <Text style={{ fontSize: 13, color: "#8E8E93", marginTop: 8 }}>Your resume, always evolving.</Text>
        </Animated.View>

        {/* PRIMARY — Upload CTA */}
        <Animated.View style={{ transform: [{ translateY: slideAnim }] }}>
          <Text style={{ color: "#FFFFFF", fontSize: 11, fontWeight: "900", letterSpacing: 2, marginBottom: 16, textAlign: "center" }}>
            DO YOU HAVE AN EXISTING RESUME?
          </Text>

          <TouchableOpacity
            onPress={() => router.push("/(onboarding)/import")}
            activeOpacity={0.85}
            style={{
              backgroundColor: "#00F0FF",
              borderRadius: 4, paddingVertical: 18,
              alignItems: "center", flexDirection: "row",
              justifyContent: "center", gap: 12, marginBottom: 14,
            }}
          >
            <LucideUpload color="#000000" size={20} />
            <Text style={{ color: "#000000", fontWeight: "900", fontSize: 15, letterSpacing: 1 }}>
              YES — UPLOAD MY RESUME
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push({ pathname: "/(onboarding)/import", params: { defaultMode: "blank" } })}
            activeOpacity={0.7}
            style={{
              backgroundColor: "transparent", borderRadius: 4, borderWidth: 1,
              borderColor: "#1F1F1F", paddingVertical: 18,
              alignItems: "center", flexDirection: "row",
              justifyContent: "center", gap: 12, marginBottom: 40,
            }}
          >
            <LucideFileText color="#8E8E93" size={20} />
            <Text style={{ color: "#8E8E93", fontWeight: "800", fontSize: 14, letterSpacing: 1 }}>
              NO — START FROM SCRATCH
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Feature pills */}
        <View style={{ gap: 12 }}>
          {[
            { color: "#00F0FF", label: "AI converts your existing resume to editable DSL format" },
            { color: "#8B5CF6", label: "Add new skills — AI inserts them in the right section automatically" },
            { color: "#FFD60A", label: "Switch templates anytime without rewriting your content" },
          ].map((f, i) => (
            <View key={i} style={{ flexDirection: "row", alignItems: "flex-start", gap: 14 }}>
              <View style={{ width: 4, borderRadius: 2, backgroundColor: f.color, marginTop: 4, height: 36 }} />
              <Text style={{ color: "#8E8E93", fontSize: 13, lineHeight: 22, flex: 1 }}>{f.label}</Text>
            </View>
          ))}
        </View>

      </Animated.ScrollView>
    </SafeAreaView>
  );
}
