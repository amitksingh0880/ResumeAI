import { router } from "expo-router";
import { useState, useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { checkGrammarAndTone } from "@/services/aiService";
import {
  getActiveDocumentId,
  getApiKey,
  getDocumentById,
  updateDocumentSource,
  getSettings,
} from "@/services/storageService";
import {
  LucideChevronLeft,
  LucideSparkles,
  LucideCheckCircle2,
  LucideAlertTriangle,
  LucideArrowRight,
  LucideZap,
  LucideHistory
} from "lucide-react-native";
import { Theme, type AppTheme } from "@/constants/Theme";
import { useFocusEffect } from "expo-router";

export default function GrammarScreen() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    improvedSource: string;
    changes: { original: string; improved: string; reason: string }[];
    score: number;
  } | null>(null);
  const [applied, setApplied] = useState(false);
  const [theme, setTheme] = useState<AppTheme>(Theme.dark);

  useFocusEffect(
    useCallback(() => {
      getSettings().then(s => setTheme(Theme[s.appearance]));
    }, [])
  );

  async function handleAnalyze() {
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
    setApplied(false);
    try {
      const res = await checkGrammarAndTone(apiKey, doc.currentSource);
      setResult(res);
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "AI analysis failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleApply() {
    if (!result) return;
    const id = await getActiveDocumentId();
    if (!id) return;
    await updateDocumentSource(id, result.improvedSource, "Grammar & Power Verb Upgrade");
    setApplied(true);
    Alert.alert("Applied!", "Your resume has been upgraded with power verbs.");
  }

  const scoreColor = result
    ? result.score >= 85 ? theme.success : result.score >= 60 ? theme.warning : theme.danger
    : theme.textMuted;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Header */}
      <View style={{ 
        flexDirection: "row", alignItems: "center", padding: 16, height: 64,
        borderBottomWidth: 1, borderColor: theme.border, backgroundColor: theme.background 
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
          style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: theme.card, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: theme.border, marginRight: 16 }}
        >
          <LucideChevronLeft color={theme.accent} size={20} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ color: theme.accent, fontSize: 10, fontWeight: "900", letterSpacing: 2 }}>STUDIO INTELLIGENCE</Text>
          <Text style={{ fontSize: 18, fontWeight: "800", color: theme.textPrimary, letterSpacing: -0.5 }}>Grammar & Tone</Text>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {!result ? (
          <View style={{ gap: 24, paddingTop: 40 }}>
            <View style={{ alignItems: "center", gap: 16 }}>
              <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: theme.card, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: theme.border }}>
                <LucideZap color={theme.accent} size={32} />
              </View>
              <Text style={{ color: theme.textPrimary, fontSize: 20, fontWeight: "900", textAlign: "center" }}>Power Verb Optimizer</Text>
              <Text style={{ color: theme.textSecondary, fontSize: 14, textAlign: "center", lineHeight: 22, maxWidth: "80%" }}>
                Our neural engine will scan your resume for passive voice and weak phrasing, replacing them with high-impact power verbs.
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleAnalyze}
              disabled={loading}
              activeOpacity={0.8}
              style={{
                backgroundColor: theme.accent, borderRadius: 16, height: 56,
                alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 10,
                opacity: loading ? 0.5 : 1,
                shadowColor: theme.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8
              }}
            >
              {loading ? <ActivityIndicator color="#FFF" /> : (
                <>
                  <LucideSparkles color="#FFF" size={20} />
                  <Text style={{ color: "#FFF", fontWeight: "900", fontSize: 15, letterSpacing: 1 }}>INITIALIZE SCAN</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ gap: 20 }}>
            {/* Score Card */}
            <View style={{ backgroundColor: theme.card, borderRadius: 20, borderWidth: 1, borderColor: theme.border, padding: 24, alignItems: "center" }}>
              <View style={{ width: 100, height: 100, borderRadius: 50, borderWidth: 8, borderColor: scoreColor + "22", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                <Text style={{ color: scoreColor, fontSize: 32, fontWeight: "900" }}>{result.score}</Text>
              </View>
              <Text style={{ color: theme.textPrimary, fontSize: 18, fontWeight: "800", textAlign: "center" }}>Impact Score</Text>
              <Text style={{ color: theme.textSecondary, fontSize: 13, textAlign: "center", marginTop: 8, lineHeight: 20 }}>
                Found {result.changes.length} optimization opportunities to increase professional authority.
              </Text>
            </View>

            {/* Changes List */}
            <View style={{ gap: 12 }}>
              <Text style={{ color: theme.textPrimary, fontSize: 12, fontWeight: "900", letterSpacing: 1.5, marginBottom: 4 }}>PROPOSED IMPROVEMENTS</Text>
              {result.changes.map((c, i) => (
                <View key={i} style={{ backgroundColor: theme.card, borderRadius: 16, borderWidth: 1, borderColor: theme.border, padding: 16 }}>
                  <View style={{ flexDirection: "row", gap: 12, alignItems: "flex-start", marginBottom: 10 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: theme.danger, fontSize: 12, fontWeight: "700", textDecorationLine: "line-through", marginBottom: 4 }}>{c.original}</Text>
                      <Text style={{ color: theme.success, fontSize: 13, fontWeight: "800" }}>{c.improved}</Text>
                    </View>
                    <LucideArrowRight color={theme.textMuted} size={16} style={{ marginTop: 10 }} />
                  </View>
                  <View style={{ height: 1, backgroundColor: theme.border, marginVertical: 10 }} />
                  <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
                    <LucideHistory color={theme.accent} size={12} />
                    <Text style={{ color: theme.textSecondary, fontSize: 11, fontStyle: "italic" }}>{c.reason}</Text>
                  </View>
                </View>
              ))}
            </View>

            <TouchableOpacity
              onPress={handleApply}
              disabled={applied}
              activeOpacity={0.8}
              style={{
                backgroundColor: applied ? theme.success : theme.accent, borderRadius: 16, height: 56,
                alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 10,
                opacity: applied ? 0.7 : 1,
                shadowColor: applied ? theme.success : theme.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8
              }}
            >
              {applied ? <LucideCheckCircle2 color="#FFF" size={20} /> : <LucideSparkles color="#FFF" size={20} />}
              <Text style={{ color: "#FFF", fontWeight: "900", fontSize: 15, letterSpacing: 1 }}>
                {applied ? "OPTIMIZATIONS APPLIED" : "COMMIT ALL CHANGES"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setResult(null)}
              style={{ height: 56, borderRadius: 16, borderWidth: 1, borderColor: theme.border, alignItems: "center", justifyContent: "center" }}
            >
              <Text style={{ color: theme.textPrimary, fontWeight: "800" }}>RE-SCAN REPOSITORY</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
