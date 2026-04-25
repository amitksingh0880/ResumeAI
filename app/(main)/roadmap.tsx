import { router } from "expo-router";
import { useEffect, useState, useCallback } from "react";
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
  getSettings,
} from "@/services/storageService";
import { parseResumeDSL } from "@/services/dslParser";
import { generateCareerRoadmap, type CareerStep } from "@/services/aiService";
import { LucideCheckCircle2, LucideChevronLeft, LucideCompass, LucideMap, LucideFlag } from "lucide-react-native";
import { Theme, type AppTheme } from "@/constants/Theme";
import { useFocusEffect } from "expo-router";

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
          <Text style={{ color: theme.accent, fontSize: 10, fontWeight: "900", letterSpacing: 2 }}>STUDIO PATH</Text>
          <Text style={{ fontSize: 18, fontWeight: "800", color: theme.textPrimary, letterSpacing: -0.5 }}>Career Roadmap</Text>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={{ alignItems: "center", paddingTop: 100, gap: 20 }}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: theme.card, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: theme.border }}>
              <ActivityIndicator color={theme.accent} />
            </View>
            <Text style={{ color: theme.textSecondary, fontSize: 12, fontWeight: "800", letterSpacing: 2 }}>CALCULATING TRAJECTORY...</Text>
          </View>
        ) : roadmap ? (
          <View style={{ gap: 24 }}>
            {/* Summary Card */}
            <View style={{ backgroundColor: theme.card, borderRadius: 20, borderWidth: 1, borderColor: theme.border, padding: 24 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: theme.accent + "15", alignItems: "center", justifyContent: "center" }}>
                  <LucideCompass color={theme.accent} size={24} />
                </View>
                <Text style={{ color: theme.textPrimary, fontSize: 18, fontWeight: "900" }}>Strategic Summary</Text>
              </View>
              <Text style={{ color: theme.textSecondary, fontSize: 14, lineHeight: 24 }}>{roadmap.summary}</Text>
            </View>

            {/* Steps Timeline */}
            <View style={{ gap: 16 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 4 }}>
                <LucideMap color={theme.textMuted} size={16} />
                <Text style={{ color: theme.textPrimary, fontSize: 12, fontWeight: "900", letterSpacing: 1.5 }}>STEP-BY-STEP EXECUTION</Text>
              </View>
              {roadmap.steps.map((step, i) => (
                <View key={i} style={{ flexDirection: "row", gap: 20 }}>
                  <View style={{ alignItems: "center" }}>
                    <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: i === 0 ? theme.accent : theme.card, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: i === 0 ? theme.accent : theme.border, zIndex: 1 }}>
                      {i === 0 ? <LucideCheckCircle2 color="#FFF" size={18} /> : <Text style={{ color: theme.textMuted, fontSize: 12, fontWeight: "900" }}>{i + 1}</Text>}
                    </View>
                    {i < roadmap.steps.length - 1 && (
                      <View style={{ width: 2, flex: 1, backgroundColor: theme.border, marginVertical: 4 }} />
                    )}
                  </View>
                  <View style={{ flex: 1, paddingBottom: 24 }}>
                    <View style={{ backgroundColor: theme.card, borderRadius: 16, borderWidth: 1, borderColor: theme.border, padding: 16 }}>
                      <Text style={{ color: theme.accent, fontSize: 11, fontWeight: "900", letterSpacing: 1, marginBottom: 6 }}>PHASE 0{i + 1}</Text>
                      <Text style={{ color: theme.textPrimary, fontSize: 16, fontWeight: "800", marginBottom: 10 }}>{step.role.toUpperCase()}</Text>
                      <Text style={{ color: theme.textSecondary, fontSize: 13, lineHeight: 20, marginBottom: 16 }}>{step.description}</Text>
                      
                      <View style={{ height: 1, backgroundColor: theme.border, marginVertical: 12 }} />
                      
                      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                        {step.skillsNeeded.map((skill, si) => (
                          <View key={si} style={{ backgroundColor: theme.surface, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: theme.border }}>
                            <Text style={{ color: theme.textSecondary, fontSize: 10, fontWeight: "800" }}>{skill}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </View>

            <TouchableOpacity
              onPress={handleGenerate}
              activeOpacity={0.7}
              style={{ height: 56, borderRadius: 16, borderWidth: 1, borderColor: theme.border, alignItems: "center", justifyContent: "center", marginBottom: 20 }}
            >
              <Text style={{ color: theme.textPrimary, fontWeight: "800" }}>RE-CALCULATE TRAJECTORY</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
