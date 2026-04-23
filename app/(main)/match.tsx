import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { scoreJobMatch } from "@/services/aiService";
import { getActiveDocumentId, getApiKey, getDocumentById } from "@/services/storageService";
import { LucideChevronLeft, LucideTarget, LucideZap, LucideCheckCircle2, LucideAlertCircle } from "lucide-react-native";
import { Card, Badge, Button, Input } from "@/components/ui";

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
    if (!doc) return;

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
        <Pressable onPress={() => router.back()} style={{ marginRight: 16 }}>
          <LucideChevronLeft color="#00F0FF" size={24} />
        </Pressable>
        <View>
          <Text style={{ color: "#00F0FF", fontSize: 10, fontWeight: "900", letterSpacing: 2 }}>DIAGNOSTICS</Text>
          <Text style={{ fontSize: 18, fontWeight: "800", color: "#FFFFFF" }}>Job Match Score</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={{ color: "#8E8E93", fontSize: 13, marginBottom: 24, lineHeight: 20 }}>
          Initialize a deep neural analysis to detect keyword overlaps and architectural gaps in your profile.
        </Text>

        <Card variant="outline" padding={0} style={{ marginBottom: 24, overflow: "hidden" }}>
          <TextInput
            value={jd}
            onChangeText={setJd}
            multiline
            placeholder="PASTE JOB DESCRIPTION HERE..."
            placeholderTextColor="#333"
            style={{ 
              padding: 16, 
              color: "#FFFFFF", 
              fontSize: 13, 
              lineHeight: 20, 
              minHeight: 180, 
              textAlignVertical: "top",
              fontFamily: "JetBrains Mono"
            }}
          />
        </Card>

        <Button
          title="RUN DIAGNOSTIC"
          variant="primary"
          onPress={handleScore}
          loading={loading}
          icon={<LucideTarget color="#000" size={18} />}
          style={{ marginBottom: 32 }}
        />

        {result && (
          <View style={{ gap: 24 }}>
            {/* Main Score Card */}
            <Card variant="glass" padding={24} style={{ alignItems: "center" }}>
              <View style={{ width: 120, height: 120, borderRadius: 60, borderWidth: 8, borderColor: "#1A1A1A", borderTopColor: "#00F0FF", borderRightColor: "#00F0FF", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
                <Text style={{ fontSize: 40, fontWeight: "900", color: "#FFFFFF" }}>{result.score}</Text>
                <Text style={{ fontSize: 10, color: "#00F0FF", fontWeight: "800" }}>MATCH %</Text>
              </View>
              <Text style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "600", textAlign: "center", lineHeight: 22 }}>
                {result.summary.toUpperCase()}
              </Text>
            </Card>

            {/* Keywords Analysis */}
            <View style={{ gap: 16 }}>
              <View>
                <Text style={{ color: "#FFFFFF", fontSize: 11, fontWeight: "900", letterSpacing: 2, marginBottom: 12 }}>DETECTED KEYWORDS</Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                  {result.matchedKeywords.map((k) => (
                    <View key={k} style={{ flexDirection: "row", alignItems: "center", backgroundColor: "rgba(52, 199, 89, 0.1)", borderRadius: 4, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: "rgba(52, 199, 89, 0.2)" }}>
                       <LucideCheckCircle2 color="#34C759" size={12} style={{ marginRight: 6 }} />
                       <Text style={{ color: "#34C759", fontSize: 11, fontWeight: "700" }}>{k.toUpperCase()}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View>
                <Text style={{ color: "#FFFFFF", fontSize: 11, fontWeight: "900", letterSpacing: 2, marginBottom: 12 }}>GAP ANALYSIS</Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                  {result.missingKeywords.map((k) => (
                    <View key={k} style={{ flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255, 59, 48, 0.1)", borderRadius: 4, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: "rgba(255, 59, 48, 0.2)" }}>
                       <LucideAlertCircle color="#FF3B30" size={12} style={{ marginRight: 6 }} />
                       <Text style={{ color: "#FF3B30", fontSize: 11, fontWeight: "700" }}>{k.toUpperCase()}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* Neural Suggestions */}
            <View>
              <Text style={{ color: "#FFFFFF", fontSize: 11, fontWeight: "900", letterSpacing: 2, marginBottom: 12 }}>NEURAL SUGGESTIONS</Text>
              <Card variant="outline" padding={16} style={{ gap: 12 }}>
                {result.suggestions.map((s, i) => (
                  <View key={i} style={{ flexDirection: "row", gap: 12 }}>
                    <LucideZap color="#8B5CF6" size={16} />
                    <Text style={{ color: "#8E8E93", fontSize: 13, lineHeight: 18, flex: 1 }}>{s}</Text>
                  </View>
                ))}
              </Card>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
