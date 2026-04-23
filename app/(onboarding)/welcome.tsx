import { router } from "expo-router";
import { useEffect, useRef } from "react";
import {
  Animated,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const FEATURES = [
  { icon: "📄", title: "IDE-Grade Editor", desc: "Write resumes in a clean LaTeX-inspired DSL with live preview" },
  { icon: "🤖", title: "AI-Powered Rewrites", desc: "AI finds the perfect spot to insert skills into your resume" },
  { icon: "🎨", title: "Pro Templates", desc: "Switch between Jake's CV, AltaCV, Awesome CV and more" },
  { icon: "🎯", title: "Job Match Scorer", desc: "Paste a job description and get your fit score + gap analysis" },
];

export default function WelcomeScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0A0A0A" }}>
      <Animated.ScrollView
        contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
        style={{ opacity: fadeAnim }}
      >
        {/* Logo */}
        <View style={{ alignItems: "center", marginTop: 40, marginBottom: 48 }}>
          <View style={{
            width: 80, height: 80, borderRadius: 8,
            backgroundColor: "#121212", alignItems: "center", justifyContent: "center",
            borderWidth: 1, borderColor: "#00F0FF", marginBottom: 20,
          }}>
            <Text style={{ fontSize: 36 }}>📝</Text>
          </View>
          <Text style={{ color: "#00F0FF", fontSize: 10, fontWeight: "900", letterSpacing: 3, marginBottom: 8 }}>OBSIDIAN PRO</Text>
          <Text style={{ fontSize: 32, fontWeight: "900", color: "#FFFFFF" }}>ResumeAI</Text>
          <Text style={{ fontSize: 13, color: "#8E8E93", marginTop: 8, textAlign: "center" }}>
            Your resume, always evolving
          </Text>
        </View>

        {/* Features */}
        <View style={{ marginBottom: 40 }}>
          {FEATURES.map((f, i) => (
            <View key={i} style={{
              flexDirection: "row", alignItems: "flex-start",
              backgroundColor: "#121212", borderRadius: 8,
              borderWidth: 1, borderColor: "#1F1F1F", padding: 16,
              marginBottom: 12,
            }}>
              <Text style={{ fontSize: 22, marginRight: 14 }}>{f.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: "800", color: "#FFFFFF", marginBottom: 3 }}>{f.title.toUpperCase()}</Text>
                <Text style={{ fontSize: 12, color: "#8E8E93", lineHeight: 18 }}>{f.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* CTA */}
        <TouchableOpacity
          onPress={() => router.push("/(onboarding)/import")}
          activeOpacity={0.8}
          style={{
            backgroundColor: "#00F0FF",
            borderRadius: 4, paddingVertical: 16, alignItems: "center",
          }}
        >
          <Text style={{ color: "#000000", fontWeight: "900", fontSize: 14, letterSpacing: 2 }}>
            GET STARTED
          </Text>
        </TouchableOpacity>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}
