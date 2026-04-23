import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  clearAllData,
  getApiKey,
  saveApiKey,
} from "@/services/storageService";

export default function SettingsScreen() {
  const [apiKey, setApiKey] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getApiKey().then((k) => k && setApiKey(k));
  }, []);

  async function handleSaveKey() {
    if (!apiKey.trim()) {
      Alert.alert("Empty key", "Please enter your Gemini API key.");
      return;
    }
    await saveApiKey(apiKey.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleReset() {
    Alert.alert("Reset All Data", "This will delete all your resumes and settings. Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reset", style: "destructive",
        onPress: async () => {
          await clearAllData();
          router.replace("/(onboarding)/welcome");
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0D1117" }}>
      <View style={{ flexDirection: "row", alignItems: "center", padding: 16, borderBottomWidth: 1, borderBottomColor: "#30363D" }}>
        <Pressable onPress={() => router.back()} style={{ marginRight: 12 }}>
          <Text style={{ color: "#58A6FF", fontSize: 14 }}>← Back</Text>
        </Pressable>
        <Text style={{ fontSize: 18, fontWeight: "700", color: "#E6EDF3" }}>⚙️ Settings</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 20 }}>
        {/* API Key */}
        <View style={{ backgroundColor: "#161B22", borderRadius: 14, borderWidth: 1, borderColor: "#30363D", padding: 16 }}>
          <Text style={{ color: "#E6EDF3", fontWeight: "700", fontSize: 15, marginBottom: 4 }}>
            🤖 Gemini API Key
          </Text>
          <Text style={{ color: "#8B949E", fontSize: 12, lineHeight: 18, marginBottom: 14 }}>
            Required for AI skill insertion, job matching, and resume conversion.
            Get a free key at{" "}
            <Text style={{ color: "#58A6FF" }}>aistudio.google.com</Text>
          </Text>
          <TextInput
            value={apiKey}
            onChangeText={setApiKey}
            placeholder="AIza…"
            placeholderTextColor="#6E7681"
            secureTextEntry
            style={{
              backgroundColor: "#0D1117", borderRadius: 10, borderWidth: 1,
              borderColor: "#30363D", padding: 12, color: "#E6EDF3",
              fontSize: 13, fontFamily: "Courier", marginBottom: 12,
            }}
          />
          <Pressable
            onPress={handleSaveKey}
            style={{
              backgroundColor: saved ? "#3FB950" : "#58A6FF",
              borderRadius: 10, paddingVertical: 12, alignItems: "center",
            }}
          >
            <Text style={{ color: "#0D1117", fontWeight: "800", fontSize: 14 }}>
              {saved ? "✓ Saved!" : "Save API Key"}
            </Text>
          </Pressable>
        </View>

        {/* About */}
        <View style={{ backgroundColor: "#161B22", borderRadius: 14, borderWidth: 1, borderColor: "#30363D", padding: 16 }}>
          <Text style={{ color: "#E6EDF3", fontWeight: "700", fontSize: 15, marginBottom: 10 }}>ℹ️ About</Text>
          {[
            ["App", "ResumeAI — Overleaf-Style Resume Builder"],
            ["Version", "1.0.0"],
            ["Storage", "Local device only (AsyncStorage)"],
            ["AI Engine", "Google Gemini 1.5 Flash (free tier)"],
          ].map(([label, value]) => (
            <View key={label} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#21262D" }}>
              <Text style={{ color: "#8B949E", fontSize: 13 }}>{label}</Text>
              <Text style={{ color: "#C9D1D9", fontSize: 13, flex: 1, textAlign: "right" }}>{value}</Text>
            </View>
          ))}
        </View>

        {/* DSL Reference */}
        <View style={{ backgroundColor: "#161B22", borderRadius: 14, borderWidth: 1, borderColor: "#30363D", padding: 16 }}>
          <Text style={{ color: "#E6EDF3", fontWeight: "700", fontSize: 15, marginBottom: 10 }}>📖 DSL Reference</Text>
          {[
            ["\\name{}", "Your full name"],
            ["\\role{}", "Your job title"],
            ["\\contact{}", "Email, phone, links"],
            ["\\summary{}", "Professional summary"],
            ["\\section{}", "Section heading"],
            ["\\job{title}{company}{date}", "Job entry"],
            ["\\bullet{}", "Bullet point"],
            ["\\skillgroup{cat}{items}", "Skill category"],
            ["\\degree{}{school}{year}", "Education"],
            ["\\cert{}{issuer}{year}", "Certification"],
          ].map(([cmd, desc]) => (
            <View key={cmd} style={{ flexDirection: "row", gap: 12, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: "#21262D" }}>
              <Text style={{ color: "#58A6FF", fontSize: 11, fontFamily: "Courier", minWidth: 160 }}>{cmd}</Text>
              <Text style={{ color: "#8B949E", fontSize: 11, flex: 1 }}>{desc}</Text>
            </View>
          ))}
        </View>

        {/* Danger Zone */}
        <View style={{ backgroundColor: "#1A0A0A", borderRadius: 14, borderWidth: 1, borderColor: "#F85149", padding: 16 }}>
          <Text style={{ color: "#F85149", fontWeight: "700", fontSize: 15, marginBottom: 8 }}>⚠️ Danger Zone</Text>
          <Pressable onPress={handleReset} style={{ backgroundColor: "#3A1A1A", borderRadius: 10, paddingVertical: 12, alignItems: "center", borderWidth: 1, borderColor: "#F85149" }}>
            <Text style={{ color: "#F85149", fontWeight: "700", fontSize: 14 }}>Reset All Data</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
