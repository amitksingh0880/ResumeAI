import { router } from "expo-router";
import { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Pressable,
  SafeAreaView,
  Text,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

const FEATURES = [
  { emoji: "📄", title: "Overleaf-Style Editor", desc: "Write your resume in a clean LaTeX-inspired language with live preview" },
  { emoji: "🤖", title: "AI-Powered Insertion", desc: "Add a skill — AI finds the perfect spot and rewrites your resume" },
  { emoji: "🎨", title: "7 Pro Templates", desc: "Switch between Jake's CV, AltaCV, Awesome CV and more instantly" },
  { emoji: "🎯", title: "Job Match Scorer", desc: "Paste any job description and get your fit score + gap analysis" },
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
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0D1117" }}>
      <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 48, paddingBottom: 32 }}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          {/* Logo area */}
          <View style={{ alignItems: "center", marginBottom: 48 }}>
            <View style={{
              width: 80, height: 80, borderRadius: 20,
              backgroundColor: "#1F3A5F", alignItems: "center", justifyContent: "center",
              borderWidth: 1, borderColor: "#58A6FF", marginBottom: 20,
            }}>
              <Text style={{ fontSize: 36 }}>📝</Text>
            </View>
            <Text style={{ fontSize: 32, fontWeight: "800", color: "#E6EDF3", letterSpacing: 0.5 }}>
              ResumeAI
            </Text>
            <Text style={{ fontSize: 14, color: "#8B949E", marginTop: 8, textAlign: "center" }}>
              Your resume, always evolving
            </Text>
          </View>

          {/* Features */}
          <View style={{ gap: 16, marginBottom: 48 }}>
            {FEATURES.map((f, i) => (
              <View key={i} style={{
                flexDirection: "row", alignItems: "flex-start", gap: 14,
                backgroundColor: "#161B22", borderRadius: 12,
                borderWidth: 1, borderColor: "#30363D", padding: 14,
              }}>
                <Text style={{ fontSize: 24 }}>{f.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: "700", color: "#E6EDF3", marginBottom: 3 }}>
                    {f.title}
                  </Text>
                  <Text style={{ fontSize: 12, color: "#8B949E", lineHeight: 18 }}>{f.desc}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* CTA */}
          <Pressable
            onPress={() => router.push("/(onboarding)/import")}
            style={({ pressed }) => ({
              backgroundColor: pressed ? "#79B8FF" : "#58A6FF",
              borderRadius: 12, paddingVertical: 16, alignItems: "center",
            })}
          >
            <Text style={{ color: "#0D1117", fontWeight: "800", fontSize: 16 }}>
              Get Started
            </Text>
          </Pressable>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}
