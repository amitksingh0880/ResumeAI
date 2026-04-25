import { router } from "expo-router";
import { useState, useEffect } from "react";
import { 
  Alert, 
  SafeAreaView, 
  ScrollView, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  View,
  Platform
} from "react-native";
import * as Clipboard from 'expo-clipboard';
import { 
  LucideChevronLeft, 
  LucideKey, 
  LucideCpu, 
  LucideType, 
  LucideDatabase, 
  LucideInfo, 
  LucideBookOpen, 
  LucideAlertTriangle,
  LucideDownload,
  LucideUpload,
  LucideCheckCircle2,
  LucidePalette
} from "lucide-react-native";
import { Theme } from "@/constants/Theme";
import { 
  getApiKey, 
  saveApiKey, 
  clearAllData, 
  getSettings, 
  saveSettings, 
  exportAllData, 
  importAllData,
  type AppSettings 
} from "@/services/storageService";

export default function SettingsScreen() {
  const [apiKey, setApiKey] = useState("");
  const [saved, setSaved] = useState(false);
  const [settings, setLocalSettings] = useState<AppSettings | null>(null);

  useEffect(() => {
    getApiKey().then((k) => k && setApiKey(k));
    getSettings().then(setLocalSettings);
  }, []);

  async function handleSaveKey() {
    if (!apiKey.trim()) {
      Alert.alert("Empty key", "Please enter your Groq API key.");
      return;
    }
    await saveApiKey(apiKey.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function updateSetting(key: keyof AppSettings, value: any) {
    if (!settings) return;
    const updated = { ...settings, [key]: value };
    setLocalSettings(updated);
    await saveSettings(updated);
  }

  async function handleExport() {
    try {
      const data = await exportAllData();
      await Clipboard.setStringAsync(data);
      Alert.alert("Success", "All app data copied to clipboard as JSON. Save this text somewhere safe.");
    } catch (e) {
      Alert.alert("Error", "Failed to export data.");
    }
  }

  async function handleImport() {
    if (Platform.OS === 'web') {
      const text = window.prompt("Import Data\nPaste your backup JSON text here. This will OVERWRITE existing data.");
      if (text) {
        try {
          await importAllData(text);
          alert("Data imported successfully. The app will restart.");
          router.replace("/(onboarding)/welcome");
        } catch (e) {
          alert("Invalid backup data.");
        }
      }
      return;
    }

    Alert.prompt(
      "Import Data",
      "Paste your backup JSON text here. This will OVERWRITE existing data.",
      async (text: string) => {
        try {
          await importAllData(text);
          Alert.alert("Success", "Data imported successfully. The app will restart.", [
            { text: "OK", onPress: () => router.replace("/(onboarding)/welcome") }
          ]);
        } catch (e) {
          Alert.alert("Error", "Invalid backup data.");
        }
      }
    );
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

  const DSL_CMDS = [
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
  ];

  const ABOUT = [
    ["App", "ResumeAI Pro"],
    ["Version", "1.0.0"],
    ["Storage", "Local (AsyncStorage)"],
    ["AI Engine", "Groq (Llama 3.1)"],
  ];

  if (!settings) return null;
  const colors = Theme[settings.appearance];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ 
        flexDirection: "row", alignItems: "center", padding: 16, height: 64,
        borderBottomWidth: 1, borderColor: colors.border, backgroundColor: colors.background 
      }}>
        <TouchableOpacity 
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace("/(main)/dashboard");
            }
          }} 
          activeOpacity={0.7} 
          style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: colors.card, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border, marginRight: 16 }}
        >
          <LucideChevronLeft color={colors.accent} size={20} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.accent, fontSize: 10, fontWeight: "900", letterSpacing: 2 }}>STUDIO CONFIG</Text>
          <Text style={{ fontSize: 18, fontWeight: "800", color: colors.textPrimary, letterSpacing: -0.5 }}>System Settings</Text>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={{ padding: 20, gap: 24, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >

        {/* Appearance */}
        <View style={{ backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 20 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" }}>
              <LucidePalette color={colors.accent} size={18} />
            </View>
            <Text style={{ color: colors.textPrimary, fontWeight: "800", fontSize: 13, letterSpacing: 0.5 }}>VISUAL ENGINE</Text>
          </View>
          <View style={{ flexDirection: "row", gap: 12 }}>
            {(["light", "dark"] as const).map((mode) => (
              <TouchableOpacity
                key={mode}
                onPress={() => updateSetting("appearance", mode)}
                style={{
                  flex: 1, height: 44, borderRadius: 8, alignItems: "center", justifyContent: "center",
                  backgroundColor: settings.appearance === mode ? colors.accent : colors.surface,
                  borderWidth: 1, borderColor: settings.appearance === mode ? colors.accent : colors.border
                }}
              >
                <Text style={{ color: settings.appearance === mode ? "#FFF" : colors.textSecondary, fontSize: 11, fontWeight: "900", letterSpacing: 0.5 }}>
                  {mode.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* AI & API */}
        <View style={{ backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 20 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" }}>
              <LucideKey color={colors.accent} size={18} />
            </View>
            <Text style={{ color: colors.textPrimary, fontWeight: "800", fontSize: 13, letterSpacing: 0.5 }}>AI ACCESS CREDENTIALS</Text>
          </View>
          
          <Text style={{ color: colors.textSecondary, fontSize: 12, lineHeight: 20, marginBottom: 16 }}>
            Configure your Groq identity to enable high-speed neural resume synthesis.
          </Text>
          
          <TextInput
            value={apiKey}
            onChangeText={setApiKey}
            placeholder="gsk_xxxxxxxxxxxxxxxxxxxx"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
            style={{
              backgroundColor: colors.surface, borderRadius: 8, borderWidth: 1,
              borderColor: colors.border, padding: 14, color: colors.textPrimary,
              fontSize: 13, marginBottom: 16,
            }}
          />
          <TouchableOpacity
            onPress={handleSaveKey}
            activeOpacity={0.8}
            style={{ 
              backgroundColor: saved ? colors.success : colors.accent, borderRadius: 8, 
              height: 48, alignItems: "center", justifyContent: "center",
              shadowColor: saved ? colors.success : colors.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8
            }}
          >
            <Text style={{ color: "#000", fontWeight: "900", fontSize: 13, letterSpacing: 1 }}>
              {saved ? "IDENTITY SECURED" : "AUTHORIZE KEY"}
            </Text>
          </TouchableOpacity>

          <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 24 }} />

          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" }}>
              <LucideCpu color={colors.accent} size={18} />
            </View>
            <Text style={{ color: colors.textPrimary, fontWeight: "800", fontSize: 13, letterSpacing: 0.5 }}>NEURAL PREFERENCES</Text>
          </View>

          <View style={{ flexDirection: "row", gap: 12 }}>
            {["low", "high"].map((level) => (
              <TouchableOpacity
                key={level}
                onPress={() => updateSetting("aiCreativity", level)}
                style={{
                  flex: 1, height: 44, borderRadius: 8, alignItems: "center", justifyContent: "center",
                  backgroundColor: settings.aiCreativity === level ? colors.accent : colors.surface,
                  borderWidth: 1, borderColor: settings.aiCreativity === level ? colors.accent : colors.border
                }}
              >
                <Text style={{ color: settings.aiCreativity === level ? "#FFF" : colors.textSecondary, fontSize: 11, fontWeight: "900", letterSpacing: 0.5 }}>
                  {level === "low" ? "STRICT" : "CREATIVE"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Data Management */}
        <View style={{ backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 20 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" }}>
              <LucideDatabase color={colors.accent} size={18} />
            </View>
            <Text style={{ color: colors.textPrimary, fontWeight: "800", fontSize: 13, letterSpacing: 0.5 }}>COLD STORAGE</Text>
          </View>

          <View style={{ flexDirection: "row", gap: 12 }}>
            <TouchableOpacity
              onPress={handleExport}
              style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 8, height: 48, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 10, borderWidth: 1, borderColor: colors.border }}
            >
              <LucideDownload color={colors.accent} size={16} />
              <Text style={{ color: colors.textPrimary, fontWeight: "800", fontSize: 11, letterSpacing: 0.5 }}>EXPORT</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleImport}
              style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 8, height: 48, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 10, borderWidth: 1, borderColor: colors.border }}
            >
              <LucideUpload color={colors.accent} size={16} />
              <Text style={{ color: colors.textPrimary, fontWeight: "800", fontSize: 11, letterSpacing: 0.5 }}>IMPORT</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Danger Zone */}
        <View style={{ backgroundColor: colors.danger + "10", borderRadius: 16, borderWidth: 1, borderColor: colors.danger + "33", padding: 20 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <LucideAlertTriangle color={colors.danger} size={18} />
            <Text style={{ color: colors.danger, fontWeight: "900", fontSize: 13, letterSpacing: 0.5 }}>DANGER ZONE</Text>
          </View>
          <TouchableOpacity
            onPress={handleReset}
            activeOpacity={0.8}
            style={{ 
              backgroundColor: colors.danger, borderRadius: 8, height: 48, 
              alignItems: "center", justifyContent: "center",
              shadowColor: colors.danger, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8
            }}
          >
            <Text style={{ color: "#FFF", fontWeight: "900", fontSize: 13, letterSpacing: 1 }}>FACTORY RESET</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
