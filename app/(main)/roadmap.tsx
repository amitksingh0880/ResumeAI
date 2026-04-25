import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  getActiveDocumentId,
  getDocumentById,
  getApiKey,
} from "@/services/storageService";
import { parseResumeDSL } from "@/services/dslParser";
import { generateCareerRoadmap, type CareerStep } from "@/services/aiService";
import { LucideCheckCircle2 } from "lucide-react-native";

import { Theme, type AppTheme } from "@/constants/Theme";
import { getSettings } from "@/services/storageService";
import { useFocusEffect } from "expo-router";
import { useCallback } from "react";

export default function RoadmapScreen() {
  const [loading, setLoading] = useState(false);
  const [roadmap, setRoadmap] = useState<{ steps: CareerStep[]; summary: string } | null>(null);
  const [theme, setTheme] = useState<AppTheme>(Theme.dark);

  useFocusEffect(
    useCallback(() => {
      getSettings().then(s => setTheme(Theme[s.appearance]));
    }, [])
  );

  useEffect(() => {
    handleGenerate();
  }, []);

  async function handleGenerate() {
    const apiKey = await getApiKey();
    if (!apiKey) {
      Alert.alert("API Key Required", "Add your Groq API key in Settings.");
      router.back();
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
      const ast = parseResumeDSL(doc.currentSource);
      const skills = ast.sections.flatMap(s =>
        s.items.filter(i => i.type === "skillgroup").flatMap((sg: any) => sg.items)
      );
      const res = await generateCareerRoadmap(apiKey, skills, ast.role);
      setRoadmap(res);
    } catch (e: any) {
      Alert.alert("Roadmap Error", e?.message || "Failed to generate roadmap.");
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
          <Text style={{ color: theme.accent, fontSize: 10, fontWeight: "900", letterSpacing: 2 }}>STUDIO PATH</Text>
          <Text style={{ fontSize: 18, fontWeight: "800", color: theme.textPrimary }}>Career Roadmap</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {loading ? (
          <View style={{ alignItems: "center", paddingTop: 100 }}>
            <ActivityIndicator size="large" color={theme.accent} />
            <Text style={{ color: theme.textSecondary, marginTop: 16, fontSize: 12, fontWeight: "800", letterSpacing: 1 }}>
              CALCULATING TRAJECTORY...
            </Text>
          </View>
        ) : roadmap ? (
          <>
            {/* Market Outlook */}
            <View style={{ backgroundColor: theme.card, borderRadius: 8, borderWidth: 1, borderColor: theme.border, padding: 20, marginBottom: 28 }}>
              <Text style={{ color: theme.accent, fontSize: 10, fontWeight: "900", letterSpacing: 2, marginBottom: 8 }}>MARKET OUTLOOK</Text>
              <Text style={{ color: theme.textPrimary, fontSize: 15, fontWeight: "800", marginBottom: 8 }}>Strategic Analysis</Text>
              <Text style={{ color: theme.textSecondary, fontSize: 13, lineHeight: 20 }}>{roadmap.summary}</Text>
            </View>

            <Text style={{ color: theme.textPrimary, fontSize: 11, fontWeight: "900", letterSpacing: 2, marginBottom: 16 }}>EVOLUTIONARY PHASES</Text>

            {roadmap.steps.map((step, i) => (
              <View key={i} style={{
                backgroundColor: theme.card, borderRadius: 8, padding: 20,
                borderWidth: 1, borderColor: i === 0 ? theme.accent : theme.border,
                marginBottom: 16,
              }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <View style={{ backgroundColor: i === 0 ? theme.accent + "15" : theme.surface, borderRadius: 4, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: i === 0 ? theme.accent : theme.border }}>
                    <Text style={{ color: i === 0 ? theme.accent : theme.textSecondary, fontSize: 10, fontWeight: "900", letterSpacing: 1 }}>PHASE 0{i + 1}</Text>
                  </View>
                </View>
                <Text style={{ color: theme.textPrimary, fontSize: 16, fontWeight: "800", marginBottom: 6 }}>{step.role.toUpperCase()}</Text>
                <Text style={{ color: theme.textSecondary, fontSize: 13, marginBottom: 16, lineHeight: 18 }}>{step.description}</Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                  {step.skillsNeeded.map((skill, si) => (
                    <View key={si} style={{ flexDirection: "row", alignItems: "center", backgroundColor: theme.surface, borderRadius: 4, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: theme.border }}>
                      <LucideCheckCircle2 color={theme.success} size={12} style={{ marginRight: 6 }} />
                      <Text style={{ color: theme.textPrimary, fontSize: 11, fontWeight: "600" }}>{skill.toUpperCase()}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}

            <TouchableOpacity
              onPress={handleGenerate}
              activeOpacity={0.7}
              style={{ paddingVertical: 16, alignItems: "center", marginTop: 8, marginBottom: 40 }}
            >
              <Text style={{ color: theme.accent, fontSize: 13, fontWeight: "800", letterSpacing: 1 }}>✦ RE-CALCULATE PATH</Text>
            </TouchableOpacity>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
