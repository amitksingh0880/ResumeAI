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
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0A0A0A" }}>
      <View style={{ flexDirection: "row", alignItems: "center", padding: 16, borderBottomWidth: 1, borderColor: "#1F1F1F" }}>
        <Pressable onPress={() => router.back()} style={{ marginRight: 12 }}>
          <Text style={{ color: "#00F0FF", fontSize: 14 }}>← Back</Text>
        </Pressable>
        <View>
          <Text style={{ color: "#00F0FF", fontSize: 10, fontWeight: "900", letterSpacing: 2 }}>CONFIG</Text>
          <Text style={{ fontSize: 18, fontWeight: "800", color: "#FFFFFF" }}>Settings</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 20 }}>
        {/* API Key */}
        <View style={{ backgroundColor: "#121212", borderRadius: 8, borderWidth: 1, borderColor: "#1F1F1F", padding: 16 }}>
          <Text style={{ color: "#FFFFFF", fontWeight: "800", fontSize: 13, marginBottom: 4, letterSpacing: 0.5 }}>GEMINI API KEY</Text>
          <Text style={{ color: "#8E8E93", fontSize: 12, lineHeight: 18, marginBottom: 14 }}>
            Required for AI features. Get a free key at{" "}
            <Text style={{ color: "#00F0FF" }}>aistudio.google.com</Text>
          </Text>
          <TextInput
            value={apiKey}
            onChangeText={setApiKey}
            placeholder="AIza…"
            placeholderTextColor="#333"
            secureTextEntry
            style={{
              backgroundColor: "#0A0A0A", borderRadius: 4, borderWidth: 1,
              borderColor: "#1F1F1F", padding: 12, color: "#FFFFFF",
              fontSize: 13, marginBottom: 12,
            }}
          />
          <Pressable
            onPress={handleSaveKey}
            style={{
              backgroundColor: saved ? "#34C759" : "#00F0FF",
              borderRadius: 4, paddingVertical: 12, alignItems: "center",
            }}
          >
            <Text style={{ color: "#000000", fontWeight: "900", fontSize: 13, letterSpacing: 1 }}>
              {saved ? "SAVED ✓" : "SAVE API KEY"}
            </Text>
          </Pressable>
        </View>

        {/* About */}
        <View style={{ backgroundColor: "#121212", borderRadius: 8, borderWidth: 1, borderColor: "#1F1F1F", padding: 16 }}>
          <Text style={{ color: "#FFFFFF", fontWeight: "800", fontSize: 13, marginBottom: 12, letterSpacing: 0.5 }}>ABOUT</Text>
          {[
            ["App", "ResumeAI Pro"],
            ["Version", "1.0.0"],
            ["Storage", "Local (AsyncStorage)"],
            ["AI Engine", "Google Gemini 1.5 Flash"],
          ].map(([label, value]) => (
            <View key={label} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderColor: "#1F1F1F" }}>
              <Text style={{ color: "#8E8E93", fontSize: 12 }}>{label}</Text>
              <Text style={{ color: "#FFFFFF", fontSize: 12, flex: 1, textAlign: "right" }}>{value}</Text>
            </View>
          ))}
        </View>

        {/* DSL Reference */}
        <View style={{ backgroundColor: "#121212", borderRadius: 8, borderWidth: 1, borderColor: "#1F1F1F", padding: 16 }}>
          <Text style={{ color: "#FFFFFF", fontWeight: "800", fontSize: 13, marginBottom: 12, letterSpacing: 0.5 }}>DSL REFERENCE</Text>
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
            <View key={cmd} style={{ flexDirection: "row", gap: 12, paddingVertical: 6, borderBottomWidth: 1, borderColor: "#1F1F1F" }}>
              <Text style={{ color: "#00F0FF", fontSize: 11, minWidth: 160 }}>{cmd}</Text>
              <Text style={{ color: "#8E8E93", fontSize: 11, flex: 1 }}>{desc}</Text>
            </View>
          ))}
        </View>

        {/* Danger Zone */}
        <View style={{ backgroundColor: "#120000", borderRadius: 8, borderWidth: 1, borderColor: "#FF3B30", padding: 16 }}>
          <Text style={{ color: "#FF3B30", fontWeight: "800", fontSize: 13, marginBottom: 8, letterSpacing: 0.5 }}>DANGER ZONE</Text>
          <Pressable onPress={handleReset} style={{ backgroundColor: "#1A0000", borderRadius: 4, paddingVertical: 12, alignItems: "center", borderWidth: 1, borderColor: "#FF3B30" }}>
            <Text style={{ color: "#FF3B30", fontWeight: "900", fontSize: 13, letterSpacing: 1 }}>RESET ALL DATA</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
