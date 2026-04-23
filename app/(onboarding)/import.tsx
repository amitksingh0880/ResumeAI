import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  View,
  ActivityIndicator,
} from "react-native";
import { convertTextToDSL } from "@/services/aiService";
import { getApiKey } from "@/services/storageService";
import { DEFAULT_RESUME_DSL } from "@/services/dslParser";

type Mode = "blank" | "paste" | "upload";

export default function ImportScreen() {
  const [mode, setMode] = useState<Mode>("blank");
  const [pastedText, setPastedText] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleContinue() {
    if (mode === "blank") {
      router.push({ pathname: "/(onboarding)/template-picker", params: { source: DEFAULT_RESUME_DSL } });
      return;
    }
    if (mode === "paste" && pastedText.trim().length < 50) {
      Alert.alert("Too short", "Please paste your full resume text.");
      return;
    }
    if (mode === "paste") {
      const apiKey = await getApiKey();
      if (!apiKey) {
        // No API key yet — go to template picker with raw text as source, convert later
        router.push({ pathname: "/(onboarding)/template-picker", params: { source: DEFAULT_RESUME_DSL, rawText: pastedText } });
        return;
      }
      setLoading(true);
      try {
        const dsl = await convertTextToDSL(apiKey, pastedText);
        router.push({ pathname: "/(onboarding)/template-picker", params: { source: dsl } });
      } catch (e) {
        Alert.alert("Conversion failed", "Could not convert resume. Using blank template.");
        router.push({ pathname: "/(onboarding)/template-picker", params: { source: DEFAULT_RESUME_DSL } });
      } finally {
        setLoading(false);
      }
    }
  }

  const TAB_STYLE = (active: boolean) => ({
    flex: 1, paddingVertical: 10, alignItems: "center" as const, borderRadius: 8,
    backgroundColor: active ? "#1F3A5F" : "transparent",
    borderWidth: active ? 1 : 0, borderColor: "#58A6FF",
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0D1117" }}>
      <ScrollView contentContainerStyle={{ padding: 24 }} keyboardShouldPersistTaps="handled">
        <Pressable onPress={() => router.back()} style={{ marginBottom: 24 }}>
          <Text style={{ color: "#58A6FF", fontSize: 14 }}>← Back</Text>
        </Pressable>

        <Text style={{ fontSize: 26, fontWeight: "800", color: "#E6EDF3", marginBottom: 6 }}>
          Set up your resume
        </Text>
        <Text style={{ fontSize: 14, color: "#8B949E", marginBottom: 28 }}>
          Choose how to get started
        </Text>

        {/* Mode Tabs */}
        <View style={{ flexDirection: "row", gap: 8, backgroundColor: "#161B22", borderRadius: 10, padding: 4, marginBottom: 28 }}>
          {(["blank", "paste"] as Mode[]).map((m) => (
            <Pressable key={m} style={TAB_STYLE(mode === m)} onPress={() => setMode(m)}>
              <Text style={{ color: mode === m ? "#58A6FF" : "#8B949E", fontWeight: "600", fontSize: 13, textTransform: "capitalize" }}>
                {m === "blank" ? "🗒️ Blank" : "📋 Paste Text"}
              </Text>
            </Pressable>
          ))}
        </View>

        {mode === "blank" && (
          <View style={{ backgroundColor: "#161B22", borderRadius: 12, borderWidth: 1, borderColor: "#30363D", padding: 20 }}>
            <Text style={{ fontSize: 24, textAlign: "center", marginBottom: 12 }}>🗒️</Text>
            <Text style={{ fontSize: 15, fontWeight: "700", color: "#E6EDF3", textAlign: "center", marginBottom: 8 }}>
              Start from a template
            </Text>
            <Text style={{ fontSize: 13, color: "#8B949E", textAlign: "center", lineHeight: 20 }}>
              We'll load a professional template with sample content. Just edit the DSL source to match your details.
            </Text>
          </View>
        )}

        {mode === "paste" && (
          <View style={{ gap: 12 }}>
            <Text style={{ fontSize: 13, color: "#8B949E" }}>
              Paste your existing resume text below. Our AI will convert it to the DSL format automatically.
            </Text>
            <View style={{ borderRadius: 10, borderWidth: 1, borderColor: "#30363D", backgroundColor: "#161B22", overflow: "hidden" }}>
              <TextInput
                value={pastedText}
                onChangeText={setPastedText}
                multiline
                numberOfLines={14}
                placeholder="Paste your resume text here..."
                placeholderTextColor="#6E7681"
                style={{ padding: 14, color: "#E6EDF3", fontSize: 12, fontFamily: "Courier", lineHeight: 20, minHeight: 250, textAlignVertical: "top" }}
              />
            </View>
            <Text style={{ fontSize: 11, color: "#6E7681" }}>
              ℹ️ AI conversion requires a Gemini API key. You can add it in Settings later.
            </Text>
          </View>
        )}

        <Pressable
          onPress={handleContinue}
          disabled={loading}
          style={({ pressed }) => ({
            backgroundColor: pressed ? "#79B8FF" : "#58A6FF",
            borderRadius: 12, paddingVertical: 16, alignItems: "center", marginTop: 32,
            opacity: loading ? 0.7 : 1,
          })}
        >
          {loading ? (
            <ActivityIndicator color="#0D1117" />
          ) : (
            <Text style={{ color: "#0D1117", fontWeight: "800", fontSize: 16 }}>
              Continue →
            </Text>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
