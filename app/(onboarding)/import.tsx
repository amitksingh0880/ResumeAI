import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { convertTextToDSL } from "@/services/aiService";
import { getApiKey } from "@/services/storageService";
import { DEFAULT_RESUME_DSL } from "@/services/dslParser";

type Mode = "blank" | "paste";

export default function ImportScreen() {
  const [mode, setMode] = useState<Mode>("blank");
  const [pastedText, setPastedText] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleContinue() {
    if (mode === "blank") {
      router.push({ pathname: "/(onboarding)/template-picker", params: { source: DEFAULT_RESUME_DSL } });
      return;
    }
    if (pastedText.trim().length < 50) {
      Alert.alert("Too short", "Please paste your full resume text.");
      return;
    }
    const apiKey = await getApiKey();
    if (!apiKey) {
      router.push({ pathname: "/(onboarding)/template-picker", params: { source: DEFAULT_RESUME_DSL, rawText: pastedText } });
      return;
    }
    setLoading(true);
    try {
      const dsl = await convertTextToDSL(apiKey, pastedText);
      router.push({ pathname: "/(onboarding)/template-picker", params: { source: dsl } });
    } catch {
      Alert.alert("Conversion failed", "Could not convert resume. Using blank template.");
      router.push({ pathname: "/(onboarding)/template-picker", params: { source: DEFAULT_RESUME_DSL } });
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0A0A0A" }}>
      <ScrollView contentContainerStyle={{ padding: 24 }} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 24 }} activeOpacity={0.7}>
          <Text style={{ color: "#00F0FF", fontSize: 14, fontWeight: "700" }}>← Back</Text>
        </TouchableOpacity>

        <Text style={{ color: "#00F0FF", fontSize: 10, fontWeight: "900", letterSpacing: 2, marginBottom: 4 }}>INITIALIZE</Text>
        <Text style={{ fontSize: 26, fontWeight: "900", color: "#FFFFFF", marginBottom: 6 }}>Set Up Resume</Text>
        <Text style={{ fontSize: 13, color: "#8E8E93", marginBottom: 28 }}>Choose how to get started</Text>

        {/* Mode Tabs */}
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 28 }}>
          {(["blank", "paste"] as Mode[]).map((m) => (
            <TouchableOpacity
              key={m}
              onPress={() => setMode(m)}
              activeOpacity={0.7}
              style={{
                flex: 1, paddingVertical: 12, alignItems: "center", borderRadius: 4,
                backgroundColor: mode === m ? "#1A1A1A" : "transparent",
                borderWidth: 1, borderColor: mode === m ? "#00F0FF" : "#1F1F1F",
              }}
            >
              <Text style={{ color: mode === m ? "#00F0FF" : "#8E8E93", fontWeight: "800", fontSize: 12, letterSpacing: 1 }}>
                {m === "blank" ? "BLANK" : "PASTE TEXT"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {mode === "blank" && (
          <View style={{ backgroundColor: "#121212", borderRadius: 8, borderWidth: 1, borderColor: "#1F1F1F", padding: 24, alignItems: "center" }}>
            <Text style={{ fontSize: 32, marginBottom: 12 }}>🗒️</Text>
            <Text style={{ fontSize: 14, fontWeight: "800", color: "#FFFFFF", marginBottom: 8 }}>Start from Template</Text>
            <Text style={{ fontSize: 12, color: "#8E8E93", textAlign: "center", lineHeight: 20 }}>
              We'll load a professional template with sample content. Just edit the DSL source to match your details.
            </Text>
          </View>
        )}

        {mode === "paste" && (
          <View>
            <Text style={{ fontSize: 12, color: "#8E8E93", marginBottom: 12, lineHeight: 18 }}>
              Paste your existing resume text below. Our AI will convert it to DSL format automatically.
            </Text>
            <TextInput
              value={pastedText}
              onChangeText={setPastedText}
              multiline
              placeholder="PASTE RESUME TEXT HERE..."
              placeholderTextColor="#333"
              style={{
                borderRadius: 4, borderWidth: 1, borderColor: "#1F1F1F",
                backgroundColor: "#121212", padding: 14, color: "#FFFFFF",
                fontSize: 12, lineHeight: 20, minHeight: 240, textAlignVertical: "top",
              }}
            />
            <Text style={{ fontSize: 11, color: "#444", marginTop: 8 }}>
              ℹ AI conversion requires a Gemini API key. Add it in Settings later.
            </Text>
          </View>
        )}

        <TouchableOpacity
          onPress={handleContinue}
          disabled={loading}
          activeOpacity={0.8}
          style={{
            backgroundColor: "#00F0FF",
            borderRadius: 4, paddingVertical: 16, alignItems: "center", marginTop: 32,
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading
            ? <ActivityIndicator color="#000" />
            : <Text style={{ color: "#000000", fontWeight: "900", fontSize: 13, letterSpacing: 2 }}>CONTINUE →</Text>
          }
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
