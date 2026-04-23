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

export default function MatchScreen() {
  const [jd, setJd] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    score: number;
    matchedKeywords: string[];
    missingKeywords: string[];
    suggestions: string[];
    summary: string;
  } | null>(null);

  async function handleScore() {
    if (jd.trim().length < 50) {
      Alert.alert("Too short", "Please paste the full job description.");
      return;
    }
    const apiKey = await getApiKey();
    if (!apiKey) {
      Alert.alert("API Key Required", "Add your Gemini API key in Settings.");
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
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0A0A0A" }}>
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", padding: 16, borderBottomWidth: 1, borderColor: "#1F1F1F" }}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={{ marginRight: 16 }}>
          <Text style={{ color: "#00F0FF", fontSize: 14, fontWeight: "700" }}>← Back</Text>
        </TouchableOpacity>
        <View>
          <Text style={{ color: "#00F0FF", fontSize: 10, fontWeight: "900", letterSpacing: 2 }}>DIAGNOSTICS</Text>
          <Text style={{ fontSize: 18, fontWeight: "800", color: "#FFFFFF" }}>Job Match Score</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={{ color: "#8E8E93", fontSize: 13, marginBottom: 20, lineHeight: 20 }}>
          Paste a job description to see how well your resume matches and identify keyword gaps.
        </Text>

        <TextInput
          value={jd}
          onChangeText={setJd}
          multiline
          placeholder="PASTE JOB DESCRIPTION HERE..."
          placeholderTextColor="#333"
          style={{
            borderRadius: 4, borderWidth: 1, borderColor: "#1F1F1F",
            backgroundColor: "#121212", padding: 16, color: "#FFFFFF",
            fontSize: 13, lineHeight: 20, minHeight: 180, textAlignVertical: "top",
            marginBottom: 16,
          }}
        />

        <TouchableOpacity
          onPress={handleScore}
          disabled={loading}
          activeOpacity={0.8}
          style={{
            backgroundColor: "#00F0FF", borderRadius: 4, paddingVertical: 16,
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
            <View style={{ backgroundColor: "#121212", borderRadius: 8, borderWidth: 1, borderColor: "#1F1F1F", padding: 24, alignItems: "center" }}>
              <View style={{
                width: 110, height: 110, borderRadius: 55,
                borderWidth: 8, borderColor: "#1A1A1A",
                borderTopColor: result.score >= 75 ? "#34C759" : result.score >= 50 ? "#FFD60A" : "#FF3B30",
                borderRightColor: result.score >= 75 ? "#34C759" : result.score >= 50 ? "#FFD60A" : "#FF3B30",
                alignItems: "center", justifyContent: "center", marginBottom: 16,
              }}>
                <Text style={{ fontSize: 36, fontWeight: "900", color: "#FFFFFF" }}>{result.score}</Text>
                <Text style={{ fontSize: 9, fontWeight: "800", color: "#00F0FF" }}>MATCH %</Text>
              </View>
              <Text style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "600", textAlign: "center", lineHeight: 22 }}>
                {result.summary.toUpperCase()}
              </Text>
            </View>

            {/* Matched Keywords */}
            <View>
              <Text style={{ color: "#FFFFFF", fontSize: 11, fontWeight: "900", letterSpacing: 2, marginBottom: 12 }}>DETECTED KEYWORDS</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {result.matchedKeywords.map((k) => (
                  <View key={k} style={{ flexDirection: "row", alignItems: "center", backgroundColor: "rgba(52,199,89,0.1)", borderRadius: 4, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: "rgba(52,199,89,0.2)" }}>
                    <LucideCheckCircle2 color="#34C759" size={12} style={{ marginRight: 6 }} />
                    <Text style={{ color: "#34C759", fontSize: 11, fontWeight: "700" }}>{k.toUpperCase()}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Missing Keywords */}
            <View>
              <Text style={{ color: "#FFFFFF", fontSize: 11, fontWeight: "900", letterSpacing: 2, marginBottom: 12 }}>GAP ANALYSIS</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {result.missingKeywords.map((k) => (
                  <View key={k} style={{ flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,59,48,0.1)", borderRadius: 4, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: "rgba(255,59,48,0.2)" }}>
                    <LucideAlertCircle color="#FF3B30" size={12} style={{ marginRight: 6 }} />
                    <Text style={{ color: "#FF3B30", fontSize: 11, fontWeight: "700" }}>{k.toUpperCase()}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Suggestions */}
            <View>
              <Text style={{ color: "#FFFFFF", fontSize: 11, fontWeight: "900", letterSpacing: 2, marginBottom: 12 }}>NEURAL SUGGESTIONS</Text>
              <View style={{ backgroundColor: "#121212", borderRadius: 8, borderWidth: 1, borderColor: "#1F1F1F", padding: 16 }}>
                {result.suggestions.map((s, i) => (
                  <View key={i} style={{ flexDirection: "row", marginBottom: i < result.suggestions.length - 1 ? 12 : 0 }}>
                    <LucideZap color="#8B5CF6" size={16} style={{ marginRight: 10, marginTop: 2 }} />
                    <Text style={{ color: "#8E8E93", fontSize: 13, lineHeight: 18, flex: 1 }}>{s}</Text>
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
