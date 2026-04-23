import { router, useLocalSearchParams } from "expo-router";
import { useState, useEffect } from "react";
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
import { convertTextToDSL, convertResumeWithStyle } from "@/services/aiService";
import { getApiKey, saveImportDraft } from "@/services/storageService";
import { DEFAULT_RESUME_DSL } from "@/services/dslParser";
import { pickAndReadFile } from "@/services/fileService";
import {
  LucideUpload,
  LucideFileText,
  LucideClipboard,
  LucideCheckCircle2,
} from "lucide-react-native";

type Mode = "upload" | "paste" | "blank";

export default function ImportScreen() {
  const { defaultMode } = useLocalSearchParams<{ defaultMode?: string }>();
  const [mode, setMode] = useState<Mode>("upload");
  const [pastedText, setPastedText] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; text: string } | null>(null);

  useEffect(() => {
    if (defaultMode === "blank") setMode("blank");
  }, [defaultMode]);

  // ── File Upload ──────────────────────────────────────────────────────────
  async function handlePickFile() {
    setLoading(true);
    try {
      const file = await pickAndReadFile();
      if (!file) { setLoading(false); return; }
      setUploadedFile({ name: file.name, text: file.text });
    } catch (e: any) {
      Alert.alert("Upload Failed", e.message ?? "Could not read file.");
    } finally {
      setLoading(false);
    }
  }

  // ── Continue ─────────────────────────────────────────────────────────────
  const handleContinue = async () => {
    const rawText =
      mode === "upload" ? uploadedFile?.text ?? "" :
      mode === "paste"  ? pastedText.trim()         :
      "";

    if (mode === "blank") {
      await saveImportDraft(DEFAULT_RESUME_DSL);
      router.push({ pathname: "/(onboarding)/template-picker" });
      return;
    }

    if (rawText.length < 50) {
      Alert.alert(
        "Not enough content",
        mode === "upload"
          ? "Could not extract enough text from the file. Try pasting the text instead."
          : "Please paste your full resume text."
      );
      return;
    }

    const apiKey = await getApiKey();
    if (!apiKey) {
      // No key yet — save raw text as draft, convert later after key is set
      await saveImportDraft(rawText);
      Alert.alert(
        "No API Key",
        "A Groq API key is needed to convert your resume. We'll use the blank template for now — add your key in Settings to unlock AI conversion.",
        [{ text: "OK", onPress: () =>
          router.push({ pathname: "/(onboarding)/template-picker" })
        }]
      );
      return;
    }

    setLoading(true);
    try {
      const { dsl, css } = await convertResumeWithStyle(apiKey, rawText);
      await saveImportDraft(dsl, css, uploadedFile?.name);
      router.push({ pathname: "/(onboarding)/template-picker" });
    } catch (e) {
      console.error("AI Conversion Error:", e);
      await saveImportDraft(DEFAULT_RESUME_DSL);
      Alert.alert("Conversion failed", "AI could not convert your resume. Using blank template.");
      router.push({ pathname: "/(onboarding)/template-picker" });
    } finally {
      setLoading(false);
    }
  };

  // ── Tabs ─────────────────────────────────────────────────────────────────
  const TABS: { id: Mode; label: string; icon: React.ReactNode }[] = [
    { id: "upload", label: "UPLOAD FILE", icon: <LucideUpload color={mode === "upload" ? "#00F0FF" : "#8E8E93"} size={14} /> },
    { id: "paste",  label: "PASTE TEXT",  icon: <LucideClipboard color={mode === "paste" ? "#00F0FF" : "#8E8E93"} size={14} /> },
    { id: "blank",  label: "BLANK",       icon: <LucideFileText color={mode === "blank" ? "#00F0FF" : "#8E8E93"} size={14} /> },
  ];

  const canContinue =
    mode === "blank" ||
    (mode === "upload" && !!uploadedFile) ||
    (mode === "paste" && pastedText.trim().length >= 50);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0A0A0A" }}>
      <ScrollView contentContainerStyle={{ padding: 24 }} keyboardShouldPersistTaps="handled">

        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 24 }} activeOpacity={0.7}>
          <Text style={{ color: "#00F0FF", fontSize: 14, fontWeight: "700" }}>← Back</Text>
        </TouchableOpacity>

        <Text style={{ color: "#00F0FF", fontSize: 10, fontWeight: "900", letterSpacing: 2, marginBottom: 4 }}>INITIALIZE</Text>
        <Text style={{ fontSize: 26, fontWeight: "900", color: "#FFFFFF", marginBottom: 6 }}>Import Resume</Text>
        <Text style={{ fontSize: 13, color: "#8E8E93", marginBottom: 28, lineHeight: 20 }}>
          Upload your existing resume and AI will convert it to our format, preserving your template structure for future skill additions.
        </Text>

        {/* Mode Tabs */}
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 24 }}>
          {TABS.map((t) => (
            <TouchableOpacity
              key={t.id}
              onPress={() => setMode(t.id)}
              activeOpacity={0.7}
              style={{
                flex: 1, paddingVertical: 10, paddingHorizontal: 4, alignItems: "center",
                borderRadius: 4, gap: 6,
                backgroundColor: mode === t.id ? "#1A1A1A" : "transparent",
                borderWidth: 1, borderColor: mode === t.id ? "#00F0FF" : "#1F1F1F",
              }}
            >
              {t.icon}
              <Text style={{ color: mode === t.id ? "#00F0FF" : "#8E8E93", fontWeight: "800", fontSize: 9, letterSpacing: 1 }}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── UPLOAD MODE ── */}
        {mode === "upload" && (
          <View>
            {!uploadedFile ? (
              <TouchableOpacity
                onPress={handlePickFile}
                activeOpacity={0.8}
                disabled={loading}
                style={{
                  borderRadius: 8, borderWidth: 2, borderColor: "#1F1F1F",
                  borderStyle: "dashed", padding: 40, alignItems: "center",
                  backgroundColor: "#0D0D0D",
                }}
              >
                {loading ? (
                  <>
                    <ActivityIndicator color="#00F0FF" size="large" />
                    <Text style={{ color: "#8E8E93", fontSize: 12, fontWeight: "700", marginTop: 16, letterSpacing: 1 }}>
                      READING FILE...
                    </Text>
                  </>
                ) : (
                  <>
                    <LucideUpload color="#00F0FF" size={40} />
                    <Text style={{ color: "#FFFFFF", fontSize: 15, fontWeight: "800", marginTop: 16 }}>
                      Upload Resume
                    </Text>
                    <Text style={{ color: "#8E8E93", fontSize: 12, marginTop: 6, textAlign: "center", lineHeight: 18 }}>
                      Tap to select a file{"\n"}
                      <Text style={{ color: "#444" }}>PDF · TXT · DOCX · MD</Text>
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            ) : (
              <View>
                {/* Success state */}
                <View style={{ backgroundColor: "rgba(52,199,89,0.08)", borderRadius: 8, borderWidth: 1, borderColor: "rgba(52,199,89,0.3)", padding: 20, flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
                  <LucideCheckCircle2 color="#34C759" size={32} />
                  <View style={{ marginLeft: 16, flex: 1 }}>
                    <Text style={{ color: "#34C759", fontSize: 11, fontWeight: "900", letterSpacing: 1 }}>FILE READY</Text>
                    <Text style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "700", marginTop: 2 }} numberOfLines={1}>
                      {uploadedFile.name}
                    </Text>
                    <Text style={{ color: "#8E8E93", fontSize: 11, marginTop: 2 }}>
                      {uploadedFile.text.length.toLocaleString()} characters extracted
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={handlePickFile}
                  activeOpacity={0.7}
                  style={{ paddingVertical: 10, alignItems: "center" }}
                >
                  <Text style={{ color: "#8E8E93", fontSize: 12, fontWeight: "700" }}>↑ Replace with different file</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={{ backgroundColor: "#0D0D0D", borderRadius: 8, borderWidth: 1, borderColor: "#1A1A1A", padding: 16, marginTop: 20 }}>
              <Text style={{ color: "#444", fontSize: 11, lineHeight: 18 }}>
                <Text style={{ color: "#00F0FF", fontWeight: "800" }}>HOW IT WORKS: </Text>
                AI reads your resume, converts it to our DSL format, and preserves your template structure. When you add new skills later, AI inserts them intelligently into the correct section.
              </Text>
            </View>
          </View>
        )}

        {/* ── PASTE MODE ── */}
        {mode === "paste" && (
          <View>
            <Text style={{ fontSize: 12, color: "#8E8E93", marginBottom: 12, lineHeight: 18 }}>
              Paste your resume text below. Best for PDFs — just copy all text from your PDF and paste here.
            </Text>
            <TextInput
              value={pastedText}
              onChangeText={setPastedText}
              multiline
              placeholder="PASTE RESUME TEXT HERE..."
              placeholderTextColor="#333"
              style={{
                borderRadius: 4, borderWidth: 1, borderColor: "#1F1F1F",
                backgroundColor: "#121212", padding: 16, color: "#FFFFFF",
                fontSize: 12, lineHeight: 20, minHeight: 260, textAlignVertical: "top",
              }}
            />
            <Text style={{ color: "#444", fontSize: 11, marginTop: 8 }}>
              {pastedText.length} / min 50 characters
            </Text>
          </View>
        )}

        {/* ── BLANK MODE ── */}
        {mode === "blank" && (
          <View style={{ backgroundColor: "#121212", borderRadius: 8, borderWidth: 1, borderColor: "#1F1F1F", padding: 24, alignItems: "center" }}>
            <LucideFileText color="#1F1F1F" size={48} />
            <Text style={{ fontSize: 14, fontWeight: "800", color: "#FFFFFF", marginTop: 16, marginBottom: 8 }}>
              Start from Template
            </Text>
            <Text style={{ fontSize: 12, color: "#8E8E93", textAlign: "center", lineHeight: 20 }}>
              Load a professional template with sample content. Edit the DSL source to match your details.
            </Text>
          </View>
        )}

        {/* CTA */}
        <TouchableOpacity
          onPress={handleContinue}
          disabled={loading || !canContinue}
          activeOpacity={0.8}
          style={{
            backgroundColor: canContinue ? "#00F0FF" : "#1A1A1A",
            borderRadius: 4, paddingVertical: 16, alignItems: "center", marginTop: 32,
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading
            ? <ActivityIndicator color="#000" />
            : <Text style={{ color: canContinue ? "#000000" : "#444", fontWeight: "900", fontSize: 13, letterSpacing: 2 }}>
                {mode === "upload" && uploadedFile ? "CONVERT WITH AI →" :
                 mode === "paste" ? "CONVERT WITH AI →" :
                 "CONTINUE →"}
              </Text>
          }
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}
