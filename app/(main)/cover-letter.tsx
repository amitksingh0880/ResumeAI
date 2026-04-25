import React, { useState, useEffect } from "react";
import { router } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { 
  LucideChevronLeft, 
  LucideCopy, 
  LucideCheck, 
  LucideSparkles, 
  LucideBriefcase, 
  LucideUser, 
  LucideSmile, 
  LucideSend,
  LucideRefreshCw,
  LucideArrowRight
} from "lucide-react-native";
import { getDocumentById, getActiveDocumentId, getApiKey, getSettings } from "@/services/storageService";
import { generateCoverLetter } from "@/services/aiService";
import { Theme } from "@/constants/Theme";

export default function CoverLetterScreen() {
  const [doc, setDoc] = useState<any>(null);
  const [jd, setJd] = useState("");
  const [company, setCompany] = useState("");
  const [tone, setTone] = useState<"professional" | "enthusiastic" | "concise">("professional");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    coverLetter: string;
    tone: string;
    wordCount: number;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const s = await getSettings();
      setSettings(s);
    })();
  }, []);

  const themeToUse = settings?.appearance === "dark" ? Theme.dark : Theme.light;

  async function handleGenerate() {
    if (jd.trim().length < 30) {
      Alert.alert("Too short", "Please paste the full job description.");
      return;
    }
    const apiKey = await getApiKey();
    if (!apiKey) {
      Alert.alert("API Key Required", "Add your Groq API key in Settings.");
      return;
    }
    const id = await getActiveDocumentId();
    const doc = id ? await getDocumentById(id) : null;
    if (!doc) {
      Alert.alert("No Resume", "Please create a resume first.");
      return;
    }
    setLoading(true);
    try {
      const res = await generateCoverLetter(apiKey, doc.currentSource, jd, company, tone);
      setResult(res);
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "AI generation failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!result) return;
    try {
      if (Platform.OS === "web") {
        await navigator.clipboard.writeText(result.coverLetter);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      Alert.alert("Error", "Failed to copy.");
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: themeToUse.background }}>
      {/* Header */}
      <View style={{
        flexDirection: "row", alignItems: "center", padding: 16, height: 64,
        borderBottomWidth: 1, borderColor: themeToUse.border, backgroundColor: themeToUse.background
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
          style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: themeToUse.card, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: themeToUse.border, marginRight: 16 }}
        >
          <LucideChevronLeft color={themeToUse.accent} size={20} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ color: themeToUse.accent, fontSize: 10, fontWeight: "900", letterSpacing: 2 }}>AI ASSISTANT</Text>
          <Text style={{ fontSize: 18, fontWeight: "800", color: themeToUse.textPrimary, letterSpacing: -0.5 }}>Cover Letter</Text>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {!result ? (
          <>
            {/* Input Section */}
            <View style={{ backgroundColor: themeToUse.card, borderRadius: 16, borderWidth: 1, borderColor: themeToUse.border, padding: 20, marginBottom: 24 }}>
              <Text style={{ color: themeToUse.textSecondary, fontSize: 10, fontWeight: "900", letterSpacing: 1.5, marginBottom: 12 }}>JOB DESCRIPTION</Text>
              <TextInput
                value={jd}
                onChangeText={setJd}
                multiline
                placeholder="Paste the job description here..."
                placeholderTextColor={themeToUse.textMuted}
                style={{
                  backgroundColor: themeToUse.surface, borderRadius: 12, padding: 16,
                  color: themeToUse.textPrimary, fontSize: 14, minHeight: 180, textAlignVertical: "top"
                }}
              />
            </View>

            <View style={{ marginBottom: 24 }}>
              <Text style={{ color: themeToUse.textSecondary, fontSize: 10, fontWeight: "900", letterSpacing: 1.5, marginBottom: 12 }}>CONTENT TONE</Text>
              <View style={{ flexDirection: "row", gap: 10 }}>
                {[
                  { id: "professional", label: "PRO", icon: <LucideBriefcase size={16} /> },
                  { id: "enthusiastic", label: "BOLD", icon: <LucideSparkles size={16} /> },
                  { id: "concise", label: "MINIMAL", icon: <LucideUser size={16} /> },
                ].map((t) => (
                  <TouchableOpacity
                    key={t.id}
                    onPress={() => setTone(t.id as any)}
                    style={{
                      flex: 1, height: 48, borderRadius: 12, alignItems: "center", justifyContent: "center",
                      backgroundColor: tone === t.id ? themeToUse.accent : themeToUse.card,
                      borderWidth: 1, borderColor: tone === t.id ? themeToUse.accent : themeToUse.border,
                      flexDirection: "row", gap: 6
                    }}
                  >
                    {React.cloneElement(t.icon as any, { color: tone === t.id ? "#FFF" : themeToUse.textSecondary })}
                    <Text style={{ color: tone === t.id ? "#FFF" : themeToUse.textSecondary, fontSize: 11, fontWeight: "900" }}>{t.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              onPress={handleGenerate}
              disabled={loading || !jd.trim()}
              activeOpacity={0.8}
              style={{
                backgroundColor: themeToUse.accent, borderRadius: 16, height: 56,
                alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 10,
                opacity: (!jd.trim() || loading) ? 0.5 : 1,
                shadowColor: themeToUse.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8
              }}
            >
              {loading ? <ActivityIndicator color="#FFF" /> : (
                <>
                  <LucideSend color="#FFF" size={20} />
                  <Text style={{ color: "#FFF", fontWeight: "900", fontSize: 15, letterSpacing: 1 }}>GENERATE DRAFT</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Info Card */}
            <View style={{
              backgroundColor: "rgba(139,92,246,0.08)", borderRadius: 8,
              borderWidth: 1, borderColor: "rgba(139,92,246,0.2)", padding: 16,
            }}>
              <Text style={{ color: "#8B5CF6", fontSize: 10, fontWeight: "900", letterSpacing: 1, marginBottom: 6 }}>
                HOW IT WORKS
              </Text>
              <Text style={{ color: "#888", fontSize: 11, lineHeight: 18 }}>
                AI reads your active resume and the job description, then crafts a personalized cover letter highlighting your most relevant skills and achievements.
              </Text>
            </View>
          </>
        ) : (
          <>
            {/* Result Header */}
            <View style={{
              flexDirection: "row", justifyContent: "space-between",
              alignItems: "center", marginBottom: 16,
            }}>
              <View>
                <Text style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "800" }}>
                  {company ? `Cover Letter — ${company}` : "Your Cover Letter"}
                </Text>
                <Text style={{ color: "#555", fontSize: 10, fontWeight: "800", marginTop: 2 }}>
                  {result.wordCount} WORDS · {result.tone.toUpperCase()} TONE
                </Text>
              </View>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <TouchableOpacity
                  onPress={handleCopy}
                  activeOpacity={0.7}
                  style={{
                    backgroundColor: copied ? "rgba(52,199,89,0.15)" : "rgba(0,240,255,0.1)",
                    borderRadius: 4, paddingHorizontal: 12, paddingVertical: 8,
                    flexDirection: "row", alignItems: "center", gap: 6,
                    borderWidth: 1,
                    borderColor: copied ? "rgba(52,199,89,0.3)" : "rgba(0,240,255,0.2)",
                  }}
                >
                  <LucideCopy color={copied ? "#34C759" : "#00F0FF"} size={14} />
                  <Text style={{
                    color: copied ? "#34C759" : "#00F0FF",
                    fontSize: 9, fontWeight: "900", letterSpacing: 0.5,
                  }}>
                    {copied ? "COPIED!" : "COPY"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Cover Letter Content */}
            <View style={{
              backgroundColor: "#121212", borderRadius: 8,
              borderWidth: 1, borderColor: "#1F1F1F", padding: 20,
              marginBottom: 20,
            }}>
              <Text style={{
                color: "#E0E0E0", fontSize: 13, lineHeight: 22,
                fontFamily: Platform.OS === "web" ? "'Georgia', serif" : undefined,
              }}>
                {result.coverLetter}
              </Text>
            </View>

            {/* Actions */}
            <View style={{ flexDirection: "row", gap: 12, marginBottom: 30 }}>
              <TouchableOpacity
                onPress={() => { setResult(null); }}
                activeOpacity={0.7}
                style={{
                  flex: 1, paddingVertical: 14, borderRadius: 6,
                  borderWidth: 1, borderColor: "#1F1F1F", alignItems: "center",
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <LucideRefreshCw color="#FFFFFF" size={12} />
                  <Text style={{ color: "#FFFFFF", fontSize: 10, fontWeight: "900", letterSpacing: 1 }}>
                    REGENERATE
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push("/(main)/editor")}
                activeOpacity={0.7}
                style={{
                  flex: 1, paddingVertical: 14, borderRadius: 6,
                  backgroundColor: "#00F0FF", alignItems: "center",
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Text style={{ color: "#000", fontSize: 10, fontWeight: "900", letterSpacing: 1 }}>
                    OPEN EDITOR
                  </Text>
                  <LucideArrowRight color="#000" size={12} />
                </View>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
