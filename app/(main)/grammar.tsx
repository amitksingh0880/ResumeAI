import { router } from "expo-router";
import { useState } from "react";
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
} from "@/services/storageService";
import {
  LucideChevronLeft,
  LucideSparkles,
  LucideCheckCircle2,
  LucideAlertTriangle,
  LucideArrowRight,
} from "lucide-react-native";

import { Theme, type AppTheme } from "@/constants/Theme";
import { getSettings } from "@/services/storageService";
import { useFocusEffect } from "expo-router";
import { useCallback } from "react";

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
    ? result.score >= 85
      ? theme.success
      : result.score >= 60
      ? theme.warning
      : theme.danger
    : theme.textMuted;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Header */}
      <View style={{
        flexDirection: "row", alignItems: "center", padding: 16,
        borderBottomWidth: 1, borderColor: theme.border
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
          <LucideChevronLeft color={theme.accent} size={24} />
        </TouchableOpacity>
        <View>
          <Text style={{ color: theme.accent, fontSize: 10, fontWeight: "900", letterSpacing: 2 }}>STUDIO ANALYSIS</Text>
          <Text style={{ fontSize: 18, fontWeight: "800", color: theme.textPrimary }}>Grammar & Power Verbs</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {/* Analyze Button */}
        {!result && (
          <>
            <View style={{
              backgroundColor: theme.success + "15", borderRadius: 8,
              borderWidth: 1, borderColor: theme.success + "33", padding: 20,
              marginBottom: 24, alignItems: "center",
            }}>
              <Text style={{ fontSize: 40, marginBottom: 12 }}>🔍</Text>
              <Text style={{ color: theme.textPrimary, fontSize: 14, fontWeight: "800", textAlign: "center", marginBottom: 8 }}>
                AI Writing Coach
              </Text>
              <Text style={{ color: theme.textSecondary, fontSize: 12, lineHeight: 20, textAlign: "center" }}>
                Scans your resume for weak verbs, passive voice, and vague language. Replaces them with powerful, ATS-optimized alternatives.
              </Text>
            </View>

            <View style={{
              backgroundColor: theme.card, borderRadius: 8, borderWidth: 1,
              borderColor: theme.border, padding: 16, marginBottom: 24,
            }}>
              <Text style={{ color: theme.textPrimary, fontSize: 10, fontWeight: "900", letterSpacing: 1, marginBottom: 12 }}>
                WHAT IT FIXES
              </Text>
              {[
                { bad: '"Worked on backend APIs"', good: '"Engineered scalable backend APIs"', icon: "💪" },
                { bad: '"Responsible for testing"', good: '"Spearheaded QA automation"', icon: "🎯" },
                { bad: '"Helped with deployment"', good: '"Orchestrated CI/CD pipelines"', icon: "🚀" },
              ].map((ex, i) => (
                <View key={i} style={{ marginBottom: i < 2 ? 14 : 0 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <Text style={{ fontSize: 14 }}>{ex.icon}</Text>
                    <Text style={{ color: theme.danger, fontSize: 11, fontWeight: "600", textDecorationLine: "line-through" }}>{ex.bad}</Text>
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginLeft: 22 }}>
                    <LucideArrowRight color={theme.success} size={12} />
                    <Text style={{ color: theme.success, fontSize: 11, fontWeight: "700" }}>{ex.good}</Text>
                  </View>
                </View>
              ))}
            </View>

            <TouchableOpacity
              onPress={handleAnalyze}
              disabled={loading}
              activeOpacity={0.8}
              style={{
                backgroundColor: theme.accent, borderRadius: 6, paddingVertical: 16,
                alignItems: "center", flexDirection: "row", justifyContent: "center",
                gap: 10, opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? (
                <>
                  <ActivityIndicator color="#000" />
                  <Text style={{ color: "#000", fontWeight: "800", fontSize: 12 }}>ANALYZING...</Text>
                </>
              ) : (
                <>
                  <LucideSparkles color="#000" size={18} />
                  <Text style={{ color: "#000", fontWeight: "900", fontSize: 12, letterSpacing: 1.5 }}>
                    ANALYZE MY RESUME
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </>
        )}

        {/* Results */}
        {result && (
          <View style={{ gap: 20 }}>
            {/* Score */}
            <View style={{
              backgroundColor: theme.card, borderRadius: 8, borderWidth: 1,
              borderColor: theme.border, padding: 24, alignItems: "center",
            }}>
              <View style={{
                width: 100, height: 100, borderRadius: 50,
                borderWidth: 8, borderColor: theme.surface,
                borderTopColor: scoreColor, borderRightColor: scoreColor,
                alignItems: "center", justifyContent: "center", marginBottom: 12,
              }}>
                <Text style={{ fontSize: 32, fontWeight: "900", color: theme.textPrimary }}>{result.score}</Text>
                <Text style={{ fontSize: 8, fontWeight: "800", color: scoreColor }}>WRITING SCORE</Text>
              </View>
              <Text style={{ color: theme.textSecondary, fontSize: 11, textAlign: "center" }}>
                {result.score >= 85
                  ? "Excellent! Your resume uses strong action verbs."
                  : result.score >= 60
                  ? "Good, but some bullets could use more impact."
                  : "Needs improvement — several weak verbs detected."}
              </Text>
            </View>

            {/* Changes */}
            {result.changes.length > 0 && (
              <View>
                <Text style={{ color: theme.textPrimary, fontSize: 11, fontWeight: "900", letterSpacing: 2, marginBottom: 12 }}>
                  SUGGESTED IMPROVEMENTS ({result.changes.length})
                </Text>
                {result.changes.map((c, i) => (
                  <View key={i} style={{
                    backgroundColor: theme.card, borderRadius: 6, borderWidth: 1,
                    borderColor: theme.border, padding: 14, marginBottom: 8,
                  }}>
                    <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 8, marginBottom: 6 }}>
                      <LucideAlertTriangle color={theme.warning} size={14} style={{ marginTop: 2 }} />
                      <Text style={{ color: theme.danger, fontSize: 12, flex: 1, textDecorationLine: "line-through" }}>
                        {c.original}
                      </Text>
                    </View>
                    <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 8, marginBottom: 6 }}>
                      <LucideCheckCircle2 color={theme.accent} size={14} style={{ marginTop: 2 }} />
                      <Text style={{ color: theme.accent, fontSize: 12, fontWeight: "600", flex: 1 }}>
                        {c.improved}
                      </Text>
                    </View>
                    <Text style={{ color: theme.textMuted, fontSize: 10, marginLeft: 22, fontStyle: "italic" }}>
                      {c.reason}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Apply Button */}
            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity
                onPress={() => { setResult(null); }}
                activeOpacity={0.7}
                style={{
                  flex: 1, paddingVertical: 14, borderRadius: 6,
                  borderWidth: 1, borderColor: theme.border, alignItems: "center",
                }}
              >
                <Text style={{ color: theme.textPrimary, fontSize: 10, fontWeight: "900", letterSpacing: 1 }}>
                  ↺ RE-ANALYZE
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleApply}
                disabled={applied || result.changes.length === 0}
                activeOpacity={0.8}
                style={{
                  flex: 1, paddingVertical: 14, borderRadius: 6,
                  backgroundColor: applied ? theme.surface : theme.accent,
                  alignItems: "center",
                  opacity: applied || result.changes.length === 0 ? 0.5 : 1,
                }}
              >
                <Text style={{
                  color: applied ? theme.accent : "#000",
                  fontSize: 10, fontWeight: "900", letterSpacing: 1,
                }}>
                  {applied ? "✓ APPLIED" : "APPLY ALL FIXES"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
