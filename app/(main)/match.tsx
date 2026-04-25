import { router } from "expo-router";
import { useState, useCallback } from "react";
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
import { getActiveDocumentId, getApiKey, getDocumentById, getSettings } from "@/services/storageService";
import { LucideCheckCircle2, LucideAlertCircle, LucideZap, LucideChevronLeft, LucideTarget, LucideBrain, LucideLightbulb } from "lucide-react-native";
import { Theme, type AppTheme } from "@/constants/Theme";
import { useFocusEffect } from "expo-router";

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

  const scoreColor = result
    ? result.score >= 80 ? theme.success : result.score >= 50 ? theme.warning : theme.danger
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
          <Text style={{ color: theme.accent, fontSize: 10, fontWeight: "900", letterSpacing: 2 }}>STUDIO DIAGNOSTICS</Text>
          <Text style={{ fontSize: 18, fontWeight: "800", color: theme.textPrimary, letterSpacing: -0.5 }}>Job Match Analysis</Text>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {!result ? (
          <>
            <View style={{ backgroundColor: theme.card, borderRadius: 16, borderWidth: 1, borderColor: theme.border, padding: 20, marginBottom: 24 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <LucideTarget color={theme.accent} size={20} />
                <Text style={{ color: theme.textPrimary, fontWeight: "800", fontSize: 13 }}>TARGET POSITION</Text>
              </View>
              <TextInput
                value={jd}
                onChangeText={setJd}
                multiline
                placeholder="Paste the job description here to analyze compatibility..."
                placeholderTextColor={theme.textMuted}
                style={{
                  backgroundColor: theme.surface, borderRadius: 12, padding: 16,
                  color: theme.textPrimary, fontSize: 14, minHeight: 200, textAlignVertical: "top"
                }}
              />
            </View>

            <TouchableOpacity
              onPress={handleScore}
              disabled={loading || !jd.trim()}
              activeOpacity={0.8}
              style={{
                backgroundColor: theme.accent, borderRadius: 16, height: 56,
                alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 10,
                opacity: (!jd.trim() || loading) ? 0.5 : 1,
                shadowColor: theme.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8
              }}
            >
              {loading ? <ActivityIndicator color="#FFF" /> : (
                <>
                  <LucideBrain color="#FFF" size={20} />
                  <Text style={{ color: "#FFF", fontWeight: "900", fontSize: 15, letterSpacing: 1 }}>ANALYZE MATCH</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <View style={{ gap: 20 }}>
            {/* Score Card */}
            <View style={{ backgroundColor: theme.card, borderRadius: 20, borderWidth: 1, borderColor: theme.border, padding: 24, alignItems: "center" }}>
              <View style={{ width: 100, height: 100, borderRadius: 50, borderWidth: 8, borderColor: scoreColor + "22", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                <Text style={{ color: scoreColor, fontSize: 32, fontWeight: "900" }}>{result.score}%</Text>
              </View>
              <Text style={{ color: theme.textPrimary, fontSize: 18, fontWeight: "800", textAlign: "center" }}>Neural Compatibility Score</Text>
              <Text style={{ color: theme.textSecondary, fontSize: 13, textAlign: "center", marginTop: 8, lineHeight: 20 }}>{result.summary}</Text>
            </View>

            {/* Keyword Chips */}
            <View style={{ backgroundColor: theme.card, borderRadius: 16, borderWidth: 1, borderColor: theme.border, padding: 20 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <LucideCheckCircle2 color={theme.success} size={20} />
                <Text style={{ color: theme.textPrimary, fontWeight: "800", fontSize: 13 }}>MATCHED KEYWORDS</Text>
              </View>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {result.matchedKeywords.map((kw, i) => (
                  <View key={i} style={{ backgroundColor: theme.success + "15", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: theme.success + "33" }}>
                    <Text style={{ color: theme.success, fontSize: 11, fontWeight: "800" }}>{kw.toUpperCase()}</Text>
                  </View>
                ))}
              </View>

              <View style={{ height: 1, backgroundColor: theme.border, marginVertical: 20 }} />

              <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <LucideAlertCircle color={theme.danger} size={20} />
                <Text style={{ color: theme.textPrimary, fontWeight: "800", fontSize: 13 }}>MISSING CRITICAL GAPS</Text>
              </View>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {result.missingKeywords.map((kw, i) => (
                  <View key={i} style={{ backgroundColor: theme.danger + "15", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: theme.danger + "33" }}>
                    <Text style={{ color: theme.danger, fontSize: 11, fontWeight: "800" }}>{kw.toUpperCase()}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* AI Recommendations */}
            <View style={{ backgroundColor: theme.card, borderRadius: 16, borderWidth: 1, borderColor: theme.border, padding: 20 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <LucideLightbulb color={theme.warning} size={20} />
                <Text style={{ color: theme.textPrimary, fontWeight: "800", fontSize: 13 }}>OPTIMIZATION STRATEGY</Text>
              </View>
              {result.suggestions.map((s, i) => (
                <View key={i} style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
                  <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: theme.accent, marginTop: 8 }} />
                  <Text style={{ color: theme.textSecondary, fontSize: 13, lineHeight: 20, flex: 1 }}>{s}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              onPress={() => setResult(null)}
              style={{ height: 56, borderRadius: 16, borderWidth: 1, borderColor: theme.border, alignItems: "center", justifyContent: "center" }}
            >
              <Text style={{ color: theme.textPrimary, fontWeight: "800" }}>ANALYZE ANOTHER JOB</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
