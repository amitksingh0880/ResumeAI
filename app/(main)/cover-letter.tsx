import React, { useState } from "react";
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
import { generateCoverLetter } from "@/services/aiService";
import { getActiveDocumentId, getApiKey, getDocumentById } from "@/services/storageService";
import {
  LucideChevronLeft,
  LucideSparkles,
  LucideCopy,
  LucideDownload,
  LucideFileText,
  LucideRefreshCw,
  LucideArrowRight,
  LucideTarget,
  LucideRocket,
  LucideZap,
} from "lucide-react-native";

const TONES = [
  { id: "professional" as const, label: "PROFESSIONAL", icon: <LucideTarget size={18} />, color: "#007AFF" },
  { id: "enthusiastic" as const, label: "ENTHUSIASTIC", icon: <LucideRocket size={18} />, color: "#FF6B6B" },
  { id: "concise" as const, label: "CONCISE", icon: <LucideZap size={18} />, color: "#34C759" },
];

export default function CoverLetterScreen() {
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
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0A0A0A" }}>
      {/* Header */}
      <View style={{
        flexDirection: "row", alignItems: "center", padding: 16,
        borderBottomWidth: 1, borderColor: "#1F1F1F"
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
          style={{ marginRight: 16 }}
        >
          <LucideChevronLeft color="#00F0FF" size={24} />
        </TouchableOpacity>
        <View>
          <Text style={{ color: "#8B5CF6", fontSize: 10, fontWeight: "900", letterSpacing: 2 }}>AI GENERATOR</Text>
          <Text style={{ fontSize: 18, fontWeight: "800", color: "#FFFFFF" }}>Cover Letter</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {!result ? (
          <>
            {/* Company Name */}
            <Text style={{ color: "#FFFFFF", fontSize: 10, fontWeight: "900", letterSpacing: 1.5, marginBottom: 8 }}>
              COMPANY NAME
            </Text>
            <TextInput
              value={company}
              onChangeText={setCompany}
              placeholder="e.g. Google, Amazon, Stripe..."
              placeholderTextColor="#333"
              style={{
                borderRadius: 4, borderWidth: 1, borderColor: "#1F1F1F",
                backgroundColor: "#121212", padding: 14, color: "#FFFFFF",
                fontSize: 13, marginBottom: 20,
              }}
            />

            {/* Tone Selector */}
            <Text style={{ color: "#FFFFFF", fontSize: 10, fontWeight: "900", letterSpacing: 1.5, marginBottom: 8 }}>
              TONE
            </Text>
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 20 }}>
              {TONES.map(t => (
                <TouchableOpacity
                  key={t.id}
                  onPress={() => setTone(t.id)}
                  activeOpacity={0.7}
                  style={{
                    flex: 1, paddingVertical: 12, paddingHorizontal: 8,
                    borderRadius: 6, alignItems: "center",
                    backgroundColor: tone === t.id ? `${t.color}20` : "#121212",
                    borderWidth: 1,
                    borderColor: tone === t.id ? t.color : "#1F1F1F",
                  }}
                >
                  <View style={{ marginBottom: 4 }}>
                    {React.cloneElement(t.icon as any, { color: tone === t.id ? t.color : "#555" })}
                  </View>
                  <Text style={{
                    color: tone === t.id ? t.color : "#555",
                    fontSize: 8, fontWeight: "900", letterSpacing: 1,
                  }}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Job Description */}
            <Text style={{ color: "#FFFFFF", fontSize: 10, fontWeight: "900", letterSpacing: 1.5, marginBottom: 8 }}>
              JOB DESCRIPTION
            </Text>
            <TextInput
              value={jd}
              onChangeText={setJd}
              multiline
              placeholder="PASTE THE FULL JOB DESCRIPTION HERE..."
              placeholderTextColor="#333"
              style={{
                borderRadius: 4, borderWidth: 1, borderColor: "#1F1F1F",
                backgroundColor: "#121212", padding: 16, color: "#FFFFFF",
                fontSize: 13, lineHeight: 20, minHeight: 200, textAlignVertical: "top",
                marginBottom: 24,
              }}
            />

            {/* Generate Button */}
            <TouchableOpacity
              onPress={handleGenerate}
              disabled={loading}
              activeOpacity={0.8}
              style={{
                backgroundColor: "#8B5CF6", borderRadius: 6, paddingVertical: 16,
                alignItems: "center", marginBottom: 32, opacity: loading ? 0.7 : 1,
                flexDirection: "row", justifyContent: "center", gap: 10,
              }}
            >
              {loading ? (
                <>
                  <ActivityIndicator color="#fff" />
                  <Text style={{ color: "#fff", fontWeight: "800", fontSize: 12 }}>GENERATING...</Text>
                </>
              ) : (
                <>
                  <LucideSparkles color="#fff" size={18} />
                  <Text style={{ color: "#FFFFFF", fontWeight: "900", fontSize: 12, letterSpacing: 1.5 }}>
                    GENERATE COVER LETTER
                  </Text>
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
