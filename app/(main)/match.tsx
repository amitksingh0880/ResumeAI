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
import { scoreJobMatch } from "@/services/aiService";
import { getActiveDocumentId, getApiKey, getDocumentById } from "@/services/storageService";
import { LucideCheckCircle2, LucideAlertCircle, LucideZap } from "lucide-react-native";

import { Theme, type AppTheme } from "@/constants/Theme";
import { getSettings } from "@/services/storageService";
import { useFocusEffect } from "expo-router";
import { useCallback } from "react";

export default function MatchScreen() {
  const [jd, setJd] = useState("");
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState<AppTheme>(Theme.dark);
  const [result, setResult] = useState<{
    score: number;
    matchedKeywords: string[];
    missingKeywords: string[];
    suggestions: string[];
    summary: string;
  } | null>(null);

  useFocusEffect(
    useCallback(() => {
      getSettings().then(s => setTheme(Theme[s.appearance]));
    }, [])
  );

  async function handleScore() {
    if (jd.trim().length < 50) {
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
      const res = await scoreJobMatch(apiKey, doc.currentSource, jd);
      setResult(res);
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "AI scoring failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", padding: 16, borderBottomWidth: 1, borderColor: theme.border }}>
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
          <Text style={{ color: theme.accent, fontSize: 14, fontWeight: "700" }}>← Back</Text>
        </TouchableOpacity>
        <View>
          <Text style={{ color: theme.accent, fontSize: 10, fontWeight: "900", letterSpacing: 2 }}>STUDIO DIAGNOSTICS</Text>
          <Text style={{ fontSize: 18, fontWeight: "800", color: theme.textPrimary }}>Job Match Score</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={{ color: theme.textSecondary, fontSize: 13, marginBottom: 20, lineHeight: 20 }}>
          Paste a job description to see how well your resume matches and identify keyword gaps.
        </Text>

        <TextInput
          value={jd}
          onChangeText={setJd}
          multiline
          placeholder="PASTE JOB DESCRIPTION HERE..."
          placeholderTextColor={theme.textMuted}
          style={{
            borderRadius: 4, borderWidth: 1, borderColor: theme.border,
            backgroundColor: theme.card, padding: 16, color: theme.textPrimary,
            fontSize: 13, lineHeight: 20, minHeight: 180, textAlignVertical: "top",
            marginBottom: 16,
          }}
        />

        <TouchableOpacity
          onPress={handleScore}
          disabled={loading}
          activeOpacity={0.8}
          style={{
            backgroundColor: theme.accent, borderRadius: 4, paddingVertical: 16,
            alignItems: "center", marginBottom: 32, opacity: loading ? 0.7 : 1,
          }}
        >
          {loading
            ? <ActivityIndicator color="#000" />
            : <Text style={{ color: "#000000", fontWeight: "900", fontSize: 13, letterSpacing: 2 }}>RUN DIAGNOSTIC</Text>
          }
        </TouchableOpacity>

        {result && (
          <View style={{ gap: 20 }}>
            {/* Score Ring */}
            <View style={{ backgroundColor: theme.card, borderRadius: 8, borderWidth: 1, borderColor: theme.border, padding: 24, alignItems: "center" }}>
              <View style={{
                width: 110, height: 110, borderRadius: 55,
                borderWidth: 8, borderColor: theme.surface,
                borderTopColor: result.score >= 75 ? theme.success : result.score >= 50 ? theme.warning : theme.danger,
                borderRightColor: result.score >= 75 ? theme.success : result.score >= 50 ? theme.warning : theme.danger,
                alignItems: "center", justifyContent: "center", marginBottom: 16,
              }}>
                <Text style={{ fontSize: 36, fontWeight: "900", color: theme.textPrimary }}>{result.score}</Text>
                <Text style={{ fontSize: 9, fontWeight: "800", color: theme.accent }}>MATCH %</Text>
              </View>
              <Text style={{ color: theme.textPrimary, fontSize: 14, fontWeight: "600", textAlign: "center", lineHeight: 22 }}>
                {result.summary.toUpperCase()}
              </Text>
            </View>

            {/* Matched Keywords */}
            <View>
              <Text style={{ color: theme.textPrimary, fontSize: 11, fontWeight: "900", letterSpacing: 2, marginBottom: 12 }}>DETECTED KEYWORDS</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {result.matchedKeywords.map((k) => (
                  <View key={k} style={{ flexDirection: "row", alignItems: "center", backgroundColor: theme.success + "15", borderRadius: 4, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: theme.success + "33" }}>
                    <LucideCheckCircle2 color={theme.success} size={12} style={{ marginRight: 6 }} />
                    <Text style={{ color: theme.success, fontSize: 11, fontWeight: "700" }}>{k.toUpperCase()}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Missing Keywords */}
            <View>
              <Text style={{ color: theme.textPrimary, fontSize: 11, fontWeight: "900", letterSpacing: 2, marginBottom: 12 }}>GAP ANALYSIS</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {result.missingKeywords.map((k) => (
                  <View key={k} style={{ flexDirection: "row", alignItems: "center", backgroundColor: theme.danger + "15", borderRadius: 4, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: theme.danger + "33" }}>
                    <LucideAlertCircle color={theme.danger} size={12} style={{ marginRight: 6 }} />
                    <Text style={{ color: theme.danger, fontSize: 11, fontWeight: "700" }}>{k.toUpperCase()}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Suggestions */}
            <View>
              <Text style={{ color: theme.textPrimary, fontSize: 11, fontWeight: "900", letterSpacing: 2, marginBottom: 12 }}>STUDIO SUGGESTIONS</Text>
              <View style={{ backgroundColor: theme.card, borderRadius: 8, borderWidth: 1, borderColor: theme.border, padding: 16 }}>
                {result.suggestions.map((s, i) => (
                  <View key={i} style={{ flexDirection: "row", marginBottom: i < result.suggestions.length - 1 ? 12 : 0 }}>
                    <LucideZap color={theme.accent} size={16} style={{ marginRight: 10, marginTop: 2 }} />
                    <Text style={{ color: theme.textSecondary, fontSize: 13, lineHeight: 18, flex: 1 }}>{s}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
